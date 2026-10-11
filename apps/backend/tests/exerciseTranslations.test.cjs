require('tsx/cjs');
const { test, mock } = require('node:test');
const assert = require('node:assert/strict');
const { seededExercises } = require('../src/seed/seededExercises.expanded.ts');
const { swedishExercises, exerciseTranslations } = require('../src/localization/exercises.ts');
const Exercise = require('../src/models/Exercises.ts').default;
const { findPaginatedExercises } = require('../src/services/exercisePagination.ts');
const { buildSearchFilter } = require('../src/utils/exerciseFilters.ts');

test('every seeded exercise has a complete Swedish translation', () => {
    assert.equal(swedishExercises.size, seededExercises.length);
    for (const exercise of seededExercises) {
        const translation = exerciseTranslations(exercise)?.sv;
        for (const field of ['name', 'description', 'instructions']) assert(translation?.[field]?.trim(), `${exercise.name}: ${field}`);
    }
});
test('JSON adds translations without changing canonical data; custom and unknown exercises remain untouched', () => {
    const original = seededExercises.find(exercise => exercise.name === 'Bench Press');
    const document = new Exercise(original);
    const json = document.toJSON();
    assert.equal(json.name, 'Bench Press');
    assert.equal(json.description, original.description);
    assert.equal(json.translations.sv.name, 'Bänkpress');
    assert.equal(document.isModified('translations'), false);
    assert.equal(exerciseTranslations({ ...original, isCustom: true }), undefined);
    assert.equal(exerciseTranslations({ ...original, createdBy: 'owner' }), undefined);
    assert.equal(exerciseTranslations({ ...original, name: 'Unlisted movement' }), undefined);
    assert.equal(exerciseTranslations({ name: 'Bench Press' }), undefined);
});
test('ranked aggregate results include translations and retain IDs and counts', async () => {
    const row = { _id: 'stable-id', name: 'Bench Press', isCustom: false, createdBy: null };
    mock.method(Exercise, 'aggregate', async () => [row]);
    mock.method(Exercise, 'countDocuments', async () => 1);
    try {
        const result = await findPaginatedExercises({}, 1, 12, 'popular');
        assert.equal(result.exercises[0].translations.sv.name, 'Bänkpress');
        assert.equal(result.exercises[0]._id, row._id);
        assert.equal(result.total, 1);
        assert.equal(row.translations, undefined);
    } finally { mock.restoreAll(); }
});
test('Swedish search matches canonical shared exercises without matching custom names through the catalog', () => {
    const translatedFilter = buildSearchFilter('bänkpress').$or.find(filter => filter.name?.$in);
    assert(translatedFilter.name.$in.includes('Bench Press'));
    assert.equal(translatedFilter.isCustom, false);
    assert.equal(translatedFilter.createdBy, null);
    assert(buildSearchFilter('bench').$or[0].name.test('Bench Press'));
    assert(!buildSearchFilter('.*').$or[0].name.test('Bench Press'));
});
