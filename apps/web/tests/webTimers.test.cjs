const { test, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const { WebTimerStore } = require('../src/utils/webTimerStore.ts');
const { cardioEvents, latestFreshEvent } = require('../src/utils/timerTimeline.ts');
const { clearWorkoutSnapshot, workoutScope } = require('../src/utils/workoutProgressStorage.ts');
let now, values;
const scope = workoutScope('timer-user', 'timer-draft');
beforeEach(() => {
    now = 100000; values = new Map();
    mock.method(Date, 'now', () => now);
    global.localStorage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
});
afterEach(() => { mock.restoreAll(); delete global.localStorage; });
const make = (events = [], key = scope) => new WebTimerStore(key, 10000, () => now, event => events.push(event));

test('rest pause/resume preserves remaining time; expiry fires once and stops at zero', async () => {
    const events = [], store = make(events);
    await store.restAction({ type: 'START' }); now += 3000;
    await store.restAction({ type: 'PAUSE' }); assert.equal(store.getSnapshot().rest.timeLeft, 7000);
    now += 60000; store.reconcile(); assert.equal(events.length, 0);
    await store.restAction({ type: 'START' }); now += 7000; store.reconcile(); store.reconcile();
    assert.equal(events.length, 1); assert.equal(store.getSnapshot().rest.timeLeft, 0); assert.equal(store.getSnapshot().rest.isRunning, false);
});
test('rapid reset/replacement invalidates previous event and pending async claims', async () => {
    const events = [], store = make(events);
    await store.restAction({ type: 'START' }); const revision = store.getSnapshot().revision, event = store.events()[0];
    await Promise.all([store.restAction({ type: 'RESET' }), store.restAction({ type: 'START' })]);
    assert.notEqual(store.events()[0].id, event.id); assert.equal(store.isCurrent(revision), false);
    await store.restAction({ type: 'RESET' }); now += 20000; store.reconcile(); assert.equal(events.length, 0);
});
test('background recovery skips historical intervals and emits only the latest fresh boundary', async () => {
    const events = [], store = make(events);
    await store.register('bike', { format: 'intervals', rounds: 5, workSeconds: 10, restSeconds: 5 });
    await store.cardioAction('bike', 'start'); now += 45500; store.reconcile();
    assert.equal(events.length, 1); assert.equal(events[0].cue, 'rest-end');
    now += 100000; store.reconcile(); assert.equal(events.length, 1); assert.equal(store.completion('bike').completedRounds, 5);
});
test('running cardio survives display unmount, owner reconstruction and paused restoration without cues', async () => {
    const events = [], store = make(events);
    await store.register('bike', { format: 'cardio', durationSeconds: 120 }); await store.cardioAction('bike', 'start');
    now += 30000; store.stop();
    const restored = make(events); assert.equal(restored.getSnapshot().cardio.bike.state.status, 'running');
    await restored.cardioAction('bike', 'pause'); now += 300000;
    const paused = make(events); assert.equal(paused.getSnapshot().cardio.bike.state.elapsedMs, 30000); assert.equal(events.length, 0);
    await paused.cardioAction('bike', 'resume'); now += 90000; paused.reconcile();
    assert.equal(paused.completion('bike').elapsedSeconds, 120); assert.equal(events.length, 1);
});
test('rest and cardio replacement pause each other, including cards on another route', async () => {
    const store = make();
    await store.register('bike', { format: 'cardio', durationSeconds: 60 }); await store.cardioAction('bike', 'start'); now += 2000;
    await store.restAction({ type: 'START' }); assert.equal(store.getSnapshot().cardio.bike.state.status, 'paused');
    await store.cardioAction('bike', 'resume'); assert.equal(store.getSnapshot().rest.isRunning, false);
});
test('another tab revision invalidates an old claim and synchronizes timer state', async () => {
    const first = make(), second = make();
    await first.restAction({ type: 'START' }); const revision = first.getSnapshot().revision;
    await second.restAction({ type: 'RESET' }); assert.equal(first.isCurrent(revision), false);
    first.reconcile(); assert.equal(first.getSnapshot().rest.isRunning, false);
});
test('expiry restoration stays stopped and malformed storage falls back without leaking owners', async () => {
    const events = [], store = make(events);
    await store.restAction({ type: 'START' }); now += 30000;
    const restored = make(events); assert.equal(restored.getSnapshot().rest.timeLeft, 0); assert.equal(events.length, 0);
    assert.equal(make([], workoutScope('other-user', 'timer-draft')).getSnapshot().rest.isRunning, false);
    values.set(`${scope}:web-timers`, '{bad'); assert.equal(make().getSnapshot().rest.timeLeft, 10000);
});
test('invalid persisted cardio completion cannot mark an activity complete', async () => {
    const store = make(); await store.register('bike', { format: 'cardio', durationSeconds: 60 });
    const saved = JSON.parse(values.get(`${scope}:web-timers`));
    saved.cardio.bike.state = { status: 'completed', elapsedMs: 1000, manual: false, startedAt: null };
    values.set(`${scope}:web-timers`, JSON.stringify(saved));
    assert.equal(make().completion('bike'), undefined);
});
test('ending a workout blocks late writes, future cues and stale claims', async () => {
    const key = workoutScope('timer-ended', 'timer-ended-draft'), events = [], store = make(events, key);
    await store.restAction({ type: 'START' }); const revision = store.getSnapshot().revision;
    clearWorkoutSnapshot(key); await store.restAction({ type: 'START' }); now += 10000; store.reconcile();
    assert.equal(events.length, 0); assert.equal(store.isCurrent(revision), false); assert.equal(values.get(`${key}:web-timers`), undefined);
});
test('interval events distinguish transitions, omit final rest and handle single/zero-rest rounds', () => {
    const state = { status: 'running', startedAt: 1000, elapsedMs: 0, manual: false };
    assert.deepEqual(cardioEvents('run', state, { format: 'intervals', rounds: 2, workSeconds: 10, restSeconds: 5 }, 'bike').map(e => [e.at, e.cue]), [[11000,'work-end'],[16000,'rest-end'],[26000,'activity-end']]);
    assert.deepEqual(cardioEvents('run', state, { format: 'intervals', rounds: 2, workSeconds: 10, restSeconds: 0 }, 'bike').map(e => e.cue), ['work-end','activity-end']);
    assert.deepEqual(cardioEvents('run', state, { format: 'intervals', rounds: 1, workSeconds: 10, restSeconds: 99 }, 'bike').map(e => e.cue), ['activity-end']);
    assert.equal(latestFreshEvent([{ id: 'old', at: 1000, cue: 'rest-end' }], 0, 3000), undefined);
});
