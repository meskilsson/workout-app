require('tsx/cjs');
process.env.JWT_SECRET = 'timer-push-test-secret';
const { test, mock, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { TimerPushJob, TimerPushReceipt, TimerSchedule, TimerSubscription } = require('../src/models/TimerPush.ts');
const WorkoutDraft = require('../src/models/WorkoutDraft.ts').default;
const User = require('../src/models/User.ts').default;
const webpush = require('web-push');
const service = require('../src/services/timerPushService.ts');
const router = require('../src/routes/timerPushRoutes.ts').default;
const userId = '0123456789abcdef01234567', draftId = '0123456789abcdef01234568', deviceId = 'b6e32184-a668-4bf1-970e-9bce01b3d85a';
afterEach(() => mock.restoreAll());
function response() { return { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(data) { this.data = data; return this; }, sendStatus(code) { this.statusCode = code; return this; } }; }
function handler(path) { return router.stack.find(layer => layer.route?.path === path).route.stack[0].handle; }
function enable() {
    // Configuration only needs to be nonempty; the transport is mocked below.
    const old = { ...process.env };
    process.env.WEB_PUSH_VAPID_PUBLIC_KEY = 'test-public'; process.env.WEB_PUSH_VAPID_PRIVATE_KEY = 'test-private'; process.env.WEB_PUSH_SUBJECT = 'mailto:test@example.com';
    return () => { for (const key of ['WEB_PUSH_VAPID_PUBLIC_KEY','WEB_PUSH_VAPID_PRIVATE_KEY','WEB_PUSH_SUBJECT']) { if (old[key] === undefined) delete process.env[key]; else process.env[key] = old[key]; } };
}
function setupJob() {
    const now = Date.now();
    const job = { _id: 'job', userId, deviceId, draftId, revision: 10, eventId: 'run:1000', cue: 'rest-end', language: 'en', at: new Date(now), expiresAt: new Date(now + 5000) };
    mock.method(TimerPushJob, 'findOneAndUpdate', async (query) => { assert(query.$or); assert(query.expiresAt.$gt); return job; });
    mock.method(TimerPushJob, 'exists', async () => true); mock.method(TimerPushJob, 'updateOne', async () => ({}));
    mock.method(TimerSchedule, 'exists', async () => true); mock.method(TimerPushReceipt, 'exists', async () => false);
    mock.method(TimerSubscription, 'findOne', async () => ({ endpoint: 'https://fcm.googleapis.com/send/test', keys: { auth: 'test', p256dh: 'test' } }));
    mock.method(WorkoutDraft, 'findOne', async query => { assert.equal(query.status, 'active'); assert.equal(query.userId, userId); return { exercises: [] }; });
    mock.method(User, 'exists', async () => true);
    mock.method(webpush, 'sendNotification', async () => ({}));
    return job;
}
test('push endpoints reject arbitrary hosts, credentials, ports and insecure URLs', () => {
    for (const url of ['http://fcm.googleapis.com/send','https://127.0.0.1/send','https://example.com','https://fcm.googleapis.com.evil.test/send','https://user@fcm.googleapis.com/send','https://fcm.googleapis.com:444/send']) assert.equal(service.validPushEndpoint(url), false, url);
    for (const url of ['https://fcm.googleapis.com/send/test','https://updates.push.services.mozilla.com/wpush/v2/test','https://web.push.apple.com/test']) assert(service.validPushEndpoint(url));
    assert(service.validPushTime(Date.now() - 1000, Date.now())); assert(!service.validPushTime(Date.now() - 86400001, Date.now())); assert(!service.validPushTime(Infinity, Date.now()));
});
test('scheduler leases durable work, checks ownership/revision, and sends high-urgency short-lived push', async () => {
    const restore = enable();
    try { setupJob(); assert.equal(await service.deliverNextTimerPush(), true);
        const [subscription, payload, options] = webpush.sendNotification.mock.calls[0].arguments;
        assert(subscription.endpoint.startsWith('https://')); assert.equal(JSON.parse(payload).url, `/workout/${draftId}`); assert(options.TTL <= 5); assert.equal(options.urgency, 'high');
    } finally { restore(); }
});
test('cancelled revisions, ended drafts and acknowledged events are never sent', async () => {
    const restore = enable();
    try {
        for (const reason of ['revision','draft','ack']) {
            mock.restoreAll(); setupJob();
            if (reason === 'revision') mock.method(TimerSchedule, 'exists', async () => false);
            if (reason === 'draft') mock.method(WorkoutDraft, 'findOne', async () => null);
            if (reason === 'ack') mock.method(TimerPushReceipt, 'exists', async () => true);
            await service.deliverNextTimerPush(); assert.equal(webpush.sendNotification.mock.callCount(), 0, reason);
        }
    } finally { restore(); }
});
test('cancellation between validity reads and send suppresses delivery', async () => {
    const restore = enable();
    try { setupJob(); let count = 0; mock.method(TimerSchedule, 'exists', async () => ++count === 1);
        await service.deliverNextTimerPush(); assert.equal(webpush.sendNotification.mock.callCount(), 0);
    } finally { restore(); }
});
test('disabled push has no scheduler side effects', async () => {
    const old = process.env.WEB_PUSH_VAPID_PRIVATE_KEY; delete process.env.WEB_PUSH_VAPID_PRIVATE_KEY;
    try { mock.method(TimerPushJob, 'findOneAndUpdate', async () => { throw Error('must not query'); }); assert.equal(await service.deliverNextTimerPush(), false); }
    finally { if (old !== undefined) process.env.WEB_PUSH_VAPID_PRIVATE_KEY = old; }
});
test('old schedule revisions cannot insert jobs after a newer cancellation', async () => {
    mock.method(WorkoutDraft, 'findOne', async query => { assert.equal(query.userId, userId); return { status: 'active', purpose: 'workout', exercises: [] }; });
    mock.method(TimerSubscription, 'exists', async () => true);
    mock.method(TimerSchedule, 'findOneAndUpdate', async () => { throw { code: 11000 }; }); mock.method(TimerSchedule, 'exists', async () => false);
    mock.method(TimerPushJob, 'updateOne', async () => { throw Error('old schedule inserted'); });
    const res = response(); await handler('/schedule')({ user: { id: userId }, body: { deviceId, draftId, revision: 1, language: 'en', events: [] } }, res);
    assert.equal(res.statusCode, 200); assert.equal(res.data.accepted, false);
});
test('foreground receipts persist even when acknowledgment precedes job insertion', async () => {
    let receipt;
    mock.method(TimerPushReceipt, 'updateOne', async (query, update) => { receipt = { query, update }; });
    mock.method(TimerPushJob, 'updateMany', async () => ({}));
    const res = response(); await handler('/ack')({ user: { id: userId }, body: { deviceId, draftId, eventId: 'run' } }, res);
    assert.equal(receipt.query.userId, userId); assert(receipt.update.$setOnInsert.expiresAt instanceof Date); assert.equal(res.statusCode, 200);
});
test('slow schedule requests discard expired early intervals without losing future ones', async () => {
    mock.method(WorkoutDraft, 'findOne', async () => ({ status: 'active', purpose: 'workout', exercises: [] }));
    mock.method(TimerSubscription, 'exists', async () => true);
    mock.method(TimerSchedule, 'findOneAndUpdate', async () => ({}));
    mock.method(TimerSchedule, 'updateMany', async () => ({}));
    const inserted = [];
    mock.method(TimerPushJob, 'updateOne', async query => inserted.push(query.eventId));
    const res = response(); await handler('/schedule')({ user: { id: userId }, body: { deviceId, draftId, revision: 2, language: 'en',
        events: [{ id: 'old', at: Date.now() - 10000, cue: 'work-end' }, { id: 'next', at: Date.now() + 10000, cue: 'activity-end' }] } }, res);
    assert.equal(res.statusCode, 200); assert.deepEqual(inserted, ['next']);
});
test('short phase pushes expire at the following boundary instead of replaying a backlog', async () => {
    mock.method(WorkoutDraft, 'findOne', async () => ({ status: 'active', purpose: 'workout', exercises: [] }));
    mock.method(TimerSubscription, 'exists', async () => true);
    mock.method(TimerSchedule, 'findOneAndUpdate', async () => ({})); mock.method(TimerSchedule, 'updateMany', async () => ({}));
    const jobs = [];
    mock.method(TimerPushJob, 'updateOne', async (_query, update) => jobs.push(update.$setOnInsert));
    const at = Date.now() + 10000;
    await handler('/schedule')({ user: { id: userId }, body: { deviceId, draftId, revision: 3, language: 'en',
        events: [{ id: 'work', at, cue: 'work-end' }, { id: 'rest', at: at + 1000, cue: 'rest-end' }] } }, response());
    assert.equal(jobs[0].expiresAt.getTime(), at + 1000); assert.equal(jobs[0].dueAt.getTime(), at + 250);
    assert.equal(jobs[1].expiresAt.getTime(), at + 6000);
});
test('device disable removes subscriptions and invalidates pending and leased jobs', async () => {
    const calls = [];
    mock.method(TimerSubscription, 'deleteMany', async query => calls.push(query));
    mock.method(TimerSchedule, 'updateMany', async (query, update) => { assert.equal(update.$set.active, false); calls.push(query); });
    mock.method(TimerPushJob, 'updateMany', async (query, update) => { assert.deepEqual(query.status.$in, ['pending','sending']); assert.equal(update.$set.status, 'cancelled'); calls.push(query); });
    await service.disableDevicePush(userId, deviceId); assert.equal(calls.length, 3); assert(calls.every(query => query.userId === userId && query.deviceId === deviceId));
});
test('web logout cancels the authenticated device while native logout keeps its existing path', async () => {
    const RefreshSession = require('../src/models/RefreshSession.ts').default;
    const { logoutUser } = require('../src/controllers/authController.ts');
    mock.method(RefreshSession, 'findOne', async () => ({ userId }));
    mock.method(RefreshSession, 'deleteOne', async () => ({}));
    mock.method(TimerSubscription, 'deleteMany', async query => { assert.equal(query.userId, userId); assert.equal(query.deviceId, deviceId); });
    mock.method(TimerSchedule, 'updateMany', async () => ({})); mock.method(TimerPushJob, 'updateMany', async () => ({}));
    const res = response(); res.clearCookie = () => res;
    await logoutUser({ get: () => deviceId, cookies: { refreshToken: 'test' } }, res, error => { throw error; });
    assert.equal(res.statusCode, 200); assert.equal(TimerSubscription.deleteMany.mock.callCount(), 1);
    await logoutUser({ get: () => undefined, cookies: { refreshToken: 'test' } }, res, error => { throw error; });
    assert.equal(RefreshSession.findOne.mock.callCount(), 1); assert.equal(TimerSubscription.deleteMany.mock.callCount(), 1);
});
