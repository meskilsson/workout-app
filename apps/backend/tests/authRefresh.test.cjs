require('tsx/cjs');
process.env.JWT_SECRET = 'test-auth-secret';
const { test, mock, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const RefreshSession = require('../src/models/RefreshSession.ts').default;
const User = require('../src/models/User.ts').default;
const { createRefreshSession, rotateRefreshSession, hashRefreshToken, revokeRefreshSession } = require('../src/services/refreshSessionService.ts');
const { refreshUser } = require('../src/controllers/authController.ts');
const { requireAuth } = require('../src/middleware/requireAuth.ts');
const jwt = require('jsonwebtoken');
afterEach(() => mock.restoreAll());
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
