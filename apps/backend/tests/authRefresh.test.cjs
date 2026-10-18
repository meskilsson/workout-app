require('tsx/cjs');
process.env.JWT_SECRET = 'test-auth-secret';
const { test, mock, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const RefreshSession = require('../src/models/RefreshSession.ts').default;
const User = require('../src/models/User.ts').default;
const { createRefreshSession, rotateRefreshSession, hashRefreshToken, revokeRefreshSession } = require('../src/services/refreshSessionService.ts');
const { refreshUser } = require('../src/controllers/authController.ts');
const { logoutUser } = require('../src/controllers/authController.ts');
const { requireAuth } = require('../src/middleware/requireAuth.ts');
const jwt = require('jsonwebtoken');
afterEach(() => mock.restoreAll());

test('native refresh rotates a body token and returns credentials only to the native client', async () => {
    const token = 'a'.repeat(64);
    const user = { _id: { toString: () => '507f1f77bcf86cd799439011' }, email: 'user@example.com', role: 'user', deletedAt: null };
    mock.method(RefreshSession, 'findOne', async filter => { assert.equal(filter.tokenHash, hashRefreshToken(token)); return { _id: 'session', userId: 'user' }; });
    mock.method(User, 'findById', async () => user);
    mock.method(RefreshSession, 'findOneAndUpdate', async () => ({ expiresAt: new Date(Date.now() + 10000) }));
    let body;
    const response = { cookie() {}, clearCookie() {}, setHeader() {}, status() { return this; }, json(value) { body = value; } };
    await refreshUser({ cookies: {}, body: { refreshToken: token }, get: key => key === 'X-Auth-Refresh' ? '1' : key === 'X-Auth-Client' ? 'native' : undefined }, response, error => { throw error; });
    assert.equal(typeof body.token, 'string'); assert.match(body.refreshToken, /^[a-f0-9]{64}$/);
    await refreshUser({ cookies: { refreshToken: token }, get: key => key === 'X-Auth-Refresh' ? '1' : undefined }, response, error => { throw error; });
    assert.deepEqual(Object.keys(body), ['user']);
});

test('native logout revokes the secure body credential without requiring browser cookies', async () => {
    let revoked;
    mock.method(RefreshSession, 'deleteOne', async filter => { revoked = filter; });
    const response = { clearCookie() {}, status() { return this; }, json() {} };
    await logoutUser({ cookies: {}, body: { refreshToken: 'native-secret' }, get: key => key === 'X-Auth-Client' ? 'native' : undefined }, response, error => { throw error; });
    assert.deepEqual(revoked, { tokenHash: hashRefreshToken('native-secret') });
});
test('refresh sessions store only a hash and have a thirty-day expiry', async () => {
    let saved;
    mock.method(RefreshSession, 'create', async data => { saved = data; });
    const token = await createRefreshSession('user');
    assert.match(token, /^[a-f0-9]{64}$/);
    assert.equal(saved.tokenHash, hashRefreshToken(token)); assert.notEqual(saved.tokenHash, token);
    assert.ok(saved.expiresAt.getTime() - Date.now() > 29 * 86400000);
});
test('rotation checks account, atomically replaces hash, and retains absolute expiry', async () => {
    const expiresAt = new Date(Date.now() + 100000);
    mock.method(RefreshSession, 'findOne', async () => ({ _id: 'session', userId: 'user' }));
    mock.method(User, 'findById', async () => ({ _id: 'user', deletedAt: null }));
    let update;
    mock.method(RefreshSession, 'findOneAndUpdate', async (filter, change) => { update = { filter, change }; return { expiresAt }; });
    const result = await rotateRefreshSession('old');
    assert.equal(result.expiresAt, expiresAt);
    assert.equal(update.filter.tokenHash, hashRefreshToken('old'));
    assert.equal(update.change.$set.tokenHash, hashRefreshToken(result.token));
    mock.restoreAll();
    mock.method(RefreshSession, 'findOne', async () => null);
    assert.equal(await rotateRefreshSession('old'), null);
});
test('database outages do not consume a valid refresh session', async () => {
    mock.method(RefreshSession, 'findOne', async () => ({ userId: 'user' }));
    mock.method(User, 'findById', async () => { throw new Error('offline'); });
    let changed = false;
    mock.method(RefreshSession, 'findOneAndUpdate', async () => { changed = true; });
    await assert.rejects(rotateRefreshSession('old'), /offline/);
    assert.equal(changed, false);
});
test('logout revocation uses the token hash', async () => {
    let filter;
    mock.method(RefreshSession, 'deleteOne', async value => { filter = value; });
    await revokeRefreshSession('secret');
    assert.deepEqual(filter, { tokenHash: hashRefreshToken('secret') });
});
test('refresh endpoint requires a non-simple custom header', async () => {
    let status;
    const res = { status(value) { status = value; return this; }, json() {} };
    await refreshUser({ get: () => undefined }, res, () => assert.fail('unexpected next'));
    assert.equal(status, 403);
});
test('access expiry has a stable code; database outages are not authentication failures', async () => {
    let code, forwarded;
    const res = { status() { return this; }, json(value) { code = value.code; } };
    const expired = jwt.sign({ id: 'user' }, process.env.JWT_SECRET, { expiresIn: -1 });
    await requireAuth({ cookies: { token: expired } }, res, () => assert.fail('unexpected next'));
    assert.equal(code, 'ACCESS_TOKEN_EXPIRED');
    mock.method(User, 'findById', async () => { throw new Error('offline'); });
    await requireAuth({ cookies: { token: jwt.sign({ id: 'user' }, process.env.JWT_SECRET) } }, res, error => { forwarded = error; });
    assert.equal(forwarded.message, 'offline');
});

test('native bearer authentication takes precedence over a stale cookie without changing browser precedence', async () => {
    const id = '507f1f77bcf86cd799439011';
    const token = jwt.sign({ id }, process.env.JWT_SECRET);
    mock.method(User, 'findById', async () => ({ _id: { toString: () => id }, email: 'user@example.com', role: 'user' }));
    let accepted = false;
    await requireAuth({ get: () => 'native', cookies: { token: 'stale-cookie' }, headers: { authorization: `Bearer ${token}` } }, { status() { assert.fail('valid native bearer rejected'); } }, error => { assert.equal(error, undefined); accepted = true; });
    assert.equal(accepted, true);
});
