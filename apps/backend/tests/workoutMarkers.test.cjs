require('tsx/cjs');
const { test, mock, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { Types } = require('mongoose');
const Draft = require('../src/models/WorkoutDraft.ts').default;
const Session = require('../src/models/WorkoutSession.ts').default;
const { updateWorkoutSupersets, updateWorkoutDraftSets, completeWorkoutDraft } = require('../src/services/workoutDraftService.ts');
const { updateSupersetsSchema, updateWorkoutDraftSetsSchema } = require('../src/schemas/workoutDraft.schema.ts');
const draftId = '0123456789abcdef01234567', userId = '0123456789abcdef01234568';
const a = '0123456789abcdef01234569', b = '0123456789abcdef01234570';
const group = 'f8f6de5c-e305-4bba-b62b-a5375d3b79b0';
afterEach(() => mock.restoreAll());

function draft(status = 'active') {
    return { _id: new Types.ObjectId(draftId), userId: new Types.ObjectId(userId), status,
        exercises: [a, b].map((id, index) => ({ exerciseId: new Types.ObjectId(id), exerciseName: `Exercise ${index + 1}`, sets: [{ id: group, weight: 20, reps: 8, isWarmup: true }] })) };
}
test('schemas validate warm-up flags and require pairs of valid exercise IDs', () => {
    assert(updateSupersetsSchema.safeParse({ pairs: [[a, b]] }).success);
    assert(!updateSupersetsSchema.safeParse({ pairs: [[a]] }).success);
    assert(!updateSupersetsSchema.safeParse({ pairs: [['invalid', b]] }).success);
    assert(updateWorkoutDraftSetsSchema.safeParse({ exerciseId: a, sets: [{ id: group, weight: '10', reps: '8', isWarmup: true }] }).success);
    assert(!updateWorkoutDraftSetsSchema.safeParse({ exerciseId: a, sets: [{ isWarmup: 'yes' }] }).success);
});
test('pairing saves only metadata, guards ownership/status/order, and unpairing clears both markers', async () => {
    const value = draft(); let update, filter;
    mock.method(Draft, 'findOne', async query => { assert.equal(query.userId, userId); return value; });
    mock.method(Draft, 'findOneAndUpdate', async (query, change) => { filter = query; update = change; return value; });
    await updateWorkoutSupersets(draftId, [[a, b]], userId);
    assert.equal(filter.status, 'active'); assert.equal(filter.userId, userId); assert(filter.$expr);
    assert.equal(update.$set['exercises.0.supersetId'], update.$set['exercises.1.supersetId']);
    assert.equal(Object.keys(update.$set).length, 2);
    await updateWorkoutSupersets(draftId, [], userId);
    assert.deepEqual(update.$unset, { 'exercises.0.supersetId': 1, 'exercises.1.supersetId': 1 });
});
test('duplicate, missing, cardio and ended-workout pairs are rejected before writing', async () => {
    const value = draft(); let writes = 0;
    mock.method(Draft, 'findOne', async () => value);
    mock.method(Draft, 'findOneAndUpdate', async () => { writes++; });
    for (const pairs of [[[a, a]], [[a, '0123456789abcdef01234571']], [[a, b], [a, b]]]) await assert.rejects(updateWorkoutSupersets(draftId, pairs, userId));
    value.exercises[1].training = { format: 'cardio', durationSeconds: 60 };
    await assert.rejects(updateWorkoutSupersets(draftId, [[a, b]], userId));
    value.status = 'completed';
    await assert.rejects(updateWorkoutSupersets(draftId, [], userId));
    assert.equal(writes, 0);
});
test('concurrent workout changes reject a stale pairing update', async () => {
    mock.method(Draft, 'findOne', async () => draft());
    mock.method(Draft, 'findOneAndUpdate', async () => null);
    await assert.rejects(updateWorkoutSupersets(draftId, [[a, b]], userId), /workout changed/i);
});
test('warm-up metadata survives draft saving and Mongo session serialization', async () => {
    let saved;
    mock.method(Draft, 'findOneAndUpdate', async (_query, update) => { saved = update.$set['exercises.$.sets']; return draft(); });
    await updateWorkoutDraftSets(draftId, { exerciseId: a, sets: [{ id: group, weight: '20', reps: '8', isWarmup: true }] }, userId);
    assert.equal(saved[0].isWarmup, true); assert.equal(saved[0].id, group);
    const session = new Session({ userId, startedAt: new Date(), endedAt: new Date(), exercises: [{ exerciseId: a, exerciseName: 'Press', supersetId: group, sets: [{ weight: 20, reps: 8, isWarmup: true }] }] });
    assert.equal(session.validateSync(), undefined);
    assert.equal(session.toObject().exercises[0].sets[0].isWarmup, true);
    assert.equal(session.toObject().exercises[0].supersetId, group);
});
test('completing a draft preserves warm-up and superset metadata in the saved session', async () => {
    const value = draft(); value.exercises.forEach(exercise => { exercise.supersetId = group; });
    value.save = async () => value;
    mock.method(Draft, 'findOne', async () => value);
    let saved;
    mock.method(Session, 'create', async data => { saved = data; return { _id: new Types.ObjectId() }; });
    await completeWorkoutDraft(draftId, userId);
    assert(saved.exercises.every(exercise => exercise.supersetId === group && exercise.sets[0].isWarmup));
});
