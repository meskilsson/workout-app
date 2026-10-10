const { test } = require('node:test');
const assert = require('node:assert/strict');
const { finishWorkout } = require('../src/utils/finishWorkout.ts');

test('final values are saved before completing', async () => {
    const calls = [];
    const id = await finishWorkout({ readDraft: async () => ({ status: 'active' }),
        save: async () => { calls.push('save'); }, complete: async () => { calls.push('complete'); return { _id: 'session' }; } });
    assert.equal(id, 'session');
    assert.deepEqual(calls, ['save', 'complete']);
});

test('retry of an already completed draft does not write or complete again', async () => {
    const unexpected = async () => assert.fail('must not write');
    assert.equal(await finishWorkout({ readDraft: async () => ({ status: 'completed', completedSessionId: 'session' }),
        save: unexpected, complete: unexpected }), 'session');
});

test('lost completion response recovers the saved session without a second completion', async () => {
    let reads = 0, completions = 0;
    const id = await finishWorkout({ readDraft: async () => ++reads === 1 ? { status: 'active' } : { status: 'completed', completedSessionId: 'session' },
        save: async () => {}, complete: async () => { completions++; throw new Error('timed out'); } });
    assert.equal(id, 'session');
    assert.equal(completions, 1);
});

test('failed status verification reports uncertainty without retrying completion', async () => {
    let reads = 0;
    await assert.rejects(finishWorkout({ readDraft: async () => { if (++reads === 1) return { status: 'active' }; throw new Error('offline'); },
        save: async () => {}, complete: async () => { throw new Error('timed out'); } }), /Could not confirm/);
});

test('failed final save and abandoned drafts never submit completion', async () => {
    for (const status of ['active', 'abandoned']) {
        await assert.rejects(finishWorkout({ readDraft: async () => ({ status }),
            save: async () => { throw new Error('save failed'); }, complete: async () => assert.fail('must not complete') }));
    }
});
