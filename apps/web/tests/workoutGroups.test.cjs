const { test } = require('node:test');
const assert = require('node:assert/strict');
const { workoutGroups, supersetPairs } = require('../src/utils/workoutGroups.ts');
const { restAfterSupersetSet } = require('../src/utils/workoutGroups.ts');

test('supersets rest after both working sets, accounting for warmups and concurrent completions', () => {
    const exercises = [{ _id: 'a', supersetId: 'pair' }, { _id: 'b', supersetId: 'pair' }];
    const sets = { a: [{ id: 'warm', isWarmup: true, isCompleted: false }, { id: 'a1', isCompleted: false }], b: [{ id: 'b1', isCompleted: false }] };
    assert.equal(restAfterSupersetSet(exercises, sets, 'a', 0), true);
    assert.equal(restAfterSupersetSet(exercises, sets, 'a', 1), false);
    assert.equal(restAfterSupersetSet(exercises, sets, 'b', 0, new Set(['a1', 'b1'])), true);
    sets.b[0].isCompleted = true;
    assert.equal(restAfterSupersetSet(exercises, sets, 'a', 1), true);
    assert.equal(restAfterSupersetSet([{ _id: 'a' }], sets, 'a', 1), true);
});

test('supersets group exactly two exercises without losing their order or identities', () => {
    const exercises = [{ _id: 'a', supersetId: 'pair' }, { _id: 'b' }, { _id: 'c', supersetId: 'pair' }];
    assert.deepEqual(workoutGroups(exercises), [[exercises[0], exercises[2]], [exercises[1]]]);
    assert.deepEqual(supersetPairs(exercises), [['a', 'c']]);
    assert.deepEqual(supersetPairs(exercises.slice(1)), []);
});

test('orphaned and malformed groups never hide exercises or create invalid pairs', () => {
    const exercises = [{ _id: 'a', supersetId: 'orphan' }, ...['b', 'c', 'd'].map(_id => ({ _id, supersetId: 'too-many' }))];
    assert.deepEqual(workoutGroups(exercises), exercises.map(exercise => [exercise]));
    assert.deepEqual(supersetPairs(exercises), []);
});
