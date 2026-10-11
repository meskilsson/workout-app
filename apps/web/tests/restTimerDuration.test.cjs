const { test } = require('node:test');
const assert = require('node:assert/strict');
const { restTimerReducer, createRestTimerInitialState } = require('../../../packages/shared/src/timer/rest/restTimer.reducer.ts');
const { readRestDuration, saveRestDuration } = require('../src/utils/restTimerPreference.ts');
const { createWebRestTimerStorage, clearWorkoutSnapshot, workoutScope } = require('../src/utils/workoutProgressStorage.ts');

test('chosen rest duration survives reset, completion, and repeated set starts', () => {
    let state = restTimerReducer(createRestTimerInitialState(120000), { type: 'SET_DURATION', durationMs: 180000 });
    assert.equal(state.isRunning, false);
    for (let i = 0; i < 3; i++) {
        state = restTimerReducer(state, { type: 'RESET' });
        state = restTimerReducer(state, { type: 'START' });
        assert.equal(state.timeLeft, 180000);
        state = restTimerReducer({ ...state, endTime: Date.now() - 1 }, { type: 'TICK' });
        assert.equal(state.duration, 180000);
        assert.equal(state.timeLeft, 180000);
        assert.equal(state.isRunning, false);
    }
});

test('changing duration preserves running or paused state and rejects invalid values', () => {
    const paused = { ...createRestTimerInitialState(120000), timeLeft: 42000 };
    const changed = restTimerReducer(paused, { type: 'SET_DURATION', durationMs: 180000 });
    assert.equal(changed.endTime, null);
    assert.equal(changed.timeLeft, 180000);
    const running = restTimerReducer(changed, { type: 'START' });
    const before = Date.now();
    const updated = restTimerReducer(running, { type: 'SET_DURATION', durationMs: 240000 });
    assert.equal(updated.isRunning, true);
    assert(updated.endTime >= before + 240000);
    assert(updated.endTime <= Date.now() + 240000);
    for (const durationMs of [0, -1, NaN, Infinity, 1.5]) {
        assert.equal(restTimerReducer(updated, { type: 'SET_DURATION', durationMs }), updated);
    }
});

test('duration preference isolates users, tolerates bad storage, and survives workout cleanup', () => {
    const original = global.localStorage;
    const data = new Map();
    global.localStorage = { get length() { return data.size; }, key: i => [...data.keys()][i], getItem: k => data.get(k) ?? null, setItem: (k,v) => data.set(k,v), removeItem: k => data.delete(k) };
    try {
        saveRestDuration('first', 180000);
        assert.equal(readRestDuration('first'), 180000);
        assert.equal(readRestDuration('second'), 120000);
        assert.equal(readRestDuration(), 120000);
        const scope = workoutScope('first', 'duration-test');
        const storage = createWebRestTimerStorage(scope);
        storage.save(createRestTimerInitialState(180000));
        assert.equal(storage.load(readRestDuration('first')).duration, 180000);
        clearWorkoutSnapshot(scope);
        assert.equal(readRestDuration('first'), 180000);
        for (const value of ['{', 'null', '"180000"', '-1', '0', '1.5', '999999999']) {
            data.set('rest-duration:first', value);
            assert.equal(readRestDuration('first'), 120000);
        }
        global.localStorage = { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); } };
        assert.equal(readRestDuration('first'), 120000);
        assert.doesNotThrow(() => saveRestDuration('first', 180000));
    } finally { global.localStorage = original; }
});

test('minutes and seconds entry rejects out-of-range fields and empty/zero durations', () => {
    const { parseRestDuration } = require('../src/utils/restTimerPreference.ts');
    assert.equal(parseRestDuration('03', '00'), 180000);
    assert.equal(parseRestDuration('0', '45'), 45000);
    assert.equal(parseRestDuration('1', '30'), 90000);
    assert.equal(parseRestDuration('', '30'), 30000);
    for (const [minutes, seconds] of [['', ''], ['0', '0'], ['1', '60'], ['-1', '0'], ['1.5', '0'], ['1440', '01'], ['10000', '0'], ['x', '0']]) {
        assert.equal(parseRestDuration(minutes, seconds), null);
    }
});
