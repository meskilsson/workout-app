const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readExerciseBrowseState, exerciseBrowseKey, freshExerciseBrowseState } = require('../src/utils/exerciseBrowseStorage.ts');

test('exercise browsing restores filters, search, sorting and pagination in its own scope', () => {
    const key = exerciseBrowseKey('alice', 'draft-one');
    const saved = { search: 'press', sort: 'mostUsed', page: 3, filters: { equipment: 'bodyweight', difficulty: 'beginner', exerciseType: 'strength', muscles: ['chest', 'biceps'] } };
    const storage = { getItem: current => current === key ? JSON.stringify(saved) : null };
    assert.deepEqual(readExerciseBrowseState(key, storage), saved);
    for (const other of [exerciseBrowseKey('bob', 'draft-one'), exerciseBrowseKey('alice', 'draft-two'), exerciseBrowseKey('alice'), exerciseBrowseKey(undefined)]) {
        assert.deepEqual(readExerciseBrowseState(other, storage), freshExerciseBrowseState());
    }
});

test('malformed or unavailable browsing storage falls back safely; unsupported filters are discarded', () => {
    assert.deepEqual(readExerciseBrowseState('key', { getItem: () => '{bad' }), freshExerciseBrowseState());
    assert.deepEqual(readExerciseBrowseState('key', { getItem: () => { throw new Error('blocked'); } }), freshExerciseBrowseState());
    assert.deepEqual(readExerciseBrowseState('key', { getItem: () => JSON.stringify({ sort: 'unknown', page: -2, filters: { equipment: 'unknown', muscles: ['chest', 'invalid', 'chest'] } }) }), {
        ...freshExerciseBrowseState(), filters: { muscles: ['chest'] },
    });
});
