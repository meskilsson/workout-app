require('tsx/cjs');
const { test, mock } = require('node:test');
const assert = require('node:assert/strict');
const Exercise = require('../src/models/Exercises.ts').default;
const { parseExerciseQuery } = require('../src/utils/parseExerciseQuery.ts');
const { getPublicExercises, getExerciseLibrary } = require('../src/services/exerciseService.ts');
const { findPaginatedExercises } = require('../src/services/exercisePagination.ts');

test('exercise sort query defaults to name and rejects unsupported or repeated sorts', () => {
    assert.equal(parseExerciseQuery({ query: {} }).sort, 'name');
    for (const sort of ['name', 'popular', 'mostUsed']) {
        assert.equal(parseExerciseQuery({ query: { sort } }).sort, sort);
    }
    for (const sort of ['unknown', ['popular', 'mostUsed'], { value: 'popular' }]) {
        assert.throws(() => parseExerciseQuery({ query: { sort } }), /Sort must/);
    }
});

test('personal rankings require the authenticated library', async () => {
    await assert.rejects(getPublicExercises({ page: 1, limit: 10, sort: 'mostUsed' }), /authenticated/);
    await assert.rejects(findPaginatedExercises({}, 1, 10, 'mostUsed'), /authenticated/);
});

test('rankings preserve visibility and search filters, scope personal history, and sort before pagination', async () => {
    const userId = '0123456789abcdef01234567';
    const pipelines = [];
    const rows = [{ _id: 'exercise', name: 'Bench press' }];
    mock.method(Exercise, 'aggregate', async pipeline => { pipelines.push(pipeline); return rows; });
    mock.method(Exercise, 'countDocuments', async () => 25);
    try {
        for (const sort of ['popular', 'mostUsed']) {
            const result = await getExerciseLibrary(userId, { page: 2, limit: 10, sort, search: 'bench', muscles: ['chest'] });
            assert.equal(result.totalPages, 3);
            assert.equal(result.hasNextPage, true);
            assert.deepEqual(result.exercises, rows);
            const pipeline = pipelines.at(-1);
            assert.deepEqual(pipeline[0].$match.$and[0].$or[0], { isCustom: false });
            assert.equal(pipeline[0].$match.$and[0].$or[1].createdBy.toHexString(), userId);
            assert.equal(pipeline[0].$match.$and.length, 3);
            const lookup = pipeline[1].$lookup;
            assert.equal(lookup.foreignField, 'exercises.exerciseId');
            assert.equal(lookup.pipeline[0].$match.deletedAt, null);
            assert.deepEqual(lookup.pipeline[1], { $count: 'count' });
            if (sort === 'mostUsed') assert.equal(lookup.pipeline[0].$match.userId.toHexString(), userId);
            else assert.equal(lookup.pipeline[0].$match.userId, undefined);
            assert.deepEqual(pipeline[3], { $sort: { usageCount: -1, name: 1, _id: 1 } });
            assert.deepEqual(pipeline[4], { $skip: 10 });
            assert.deepEqual(pipeline[5], { $limit: 10 });
            assert.deepEqual(pipeline[2].$set.usageCount.$ifNull[1], 0);
        }
        await getPublicExercises({ page: 1, limit: 10, sort: 'popular' });
        assert.deepEqual(pipelines.at(-1)[0].$match.$and[0], { isCustom: false, createdBy: null });
    } finally { mock.restoreAll(); }
});

test('exercise type filters validate query values and restrict results before sorting/pagination', async () => {
    assert.equal(parseExerciseQuery({ query: { exerciseType: 'cardio' } }).exerciseType, 'cardio');
    assert.equal(parseExerciseQuery({ query: {} }).exerciseType, undefined);
    for (const exerciseType of ['intervals', 'unknown', ['cardio', 'strength']]) assert.throws(() => parseExerciseQuery({ query: { exerciseType } }), /Invalid exercise type/);
    const matches = [], counts = [];
    mock.method(Exercise, 'aggregate', async pipeline => { matches.push(pipeline[0].$match); return []; });
    mock.method(Exercise, 'countDocuments', async filter => { counts.push(filter); return 0; });
    try {
        await getPublicExercises({ page: 1, limit: 12, sort: 'popular', exerciseType: 'cardio', search: 'bike' });
        await getExerciseLibrary('0123456789abcdef01234567', { page: 1, limit: 12, sort: 'mostUsed', exerciseType: 'cardio' });
        for (let i = 0; i < matches.length; i++) {
            assert(matches[i].$and.some(filter => filter.exerciseType === 'cardio'));
            assert.deepEqual(counts[i], matches[i]);
        }
    } finally { mock.restoreAll(); }
});

test('Abs plus Cardio uses a union filter and preserves that union before pagination', async () => {
    const { buildMuscleFilter } = require('../src/utils/exerciseFilters.ts');
    const mixed = buildMuscleFilter(['core'], true);
    assert.deepEqual(mixed.$or, [{ exerciseType: 'cardio' }, { primaryMuscles: { $in: ['core'] } }, { secondaryMuscles: { $in: ['core'] } }]);
    assert.equal(buildMuscleFilter(['core'], false).$or.length, 2);
    assert.equal(parseExerciseQuery({ query: { includeCardio: 'true', muscles: 'core' } }).includeCardio, true);
    assert.equal(parseExerciseQuery({ query: { includeCardio: 'false' } }).includeCardio, false);
    assert.throws(() => parseExerciseQuery({ query: { includeCardio: ['true','false'] } }));
    let match;
    mock.method(Exercise, 'aggregate', async pipeline => { match = pipeline[0].$match; return []; });
    mock.method(Exercise, 'countDocuments', async () => 0);
    try {
        await getExerciseLibrary('0123456789abcdef01234567', { page: 1, limit: 12, sort: 'popular', muscles: ['core'], includeCardio: true });
        assert.deepEqual(match.$and[1], mixed);
    } finally { mock.restoreAll(); }
});
