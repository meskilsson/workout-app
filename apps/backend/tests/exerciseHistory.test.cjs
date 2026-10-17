require('tsx/cjs');
const { test, mock, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { Types } = require('mongoose');
const Draft = require('../src/models/WorkoutDraft.ts').default;
const Session = require('../src/models/WorkoutSession.ts').default;
const Exercise = require('../src/models/Exercises.ts').default;
const { lastExerciseSets } = require('../src/services/exerciseHistoryService.ts');
const service = require('../src/services/workoutDraftService.ts');
const { replaceWorkoutDraftExerciseSchema } = require('../src/schemas/workoutDraft.schema.ts');
const user = '0123456789abcdef01234567', draftId = '0123456789abcdef01234568';
const a = '0123456789abcdef01234569', b = '0123456789abcdef01234570', c = '0123456789abcdef01234571';
const history = [{ weight: 0, reps: 5, isWarmup: true }, ...[8,7,6].map(reps => ({ weight: 10, reps }))];
afterEach(() => mock.restoreAll());
function exercise(id = b, type = 'strength') { return { _id: new Types.ObjectId(id), name: 'Pull-up', exerciseType: type, primaryMuscles: ['back'], secondaryMuscles: [] }; }
function draft(status = 'building', purpose = 'workout') {
    return new Draft({ _id: draftId, userId: user, status, purpose, selectedMuscleGroups: ['back'],
        exercises: [{ exerciseId: a, exerciseName: 'Row', sets: [{ id: 'c893ecdf-ab47-44e2-af24-e051a730a78c', weight: 20, reps: 12 }] }] });
}
function mockHistory() { return mock.method(Session, 'aggregate', async () => [{ _id: new Types.ObjectId(b), sets: history }]); }
test('history query selects the latest undeleted strength session per stable exercise ID for this user', async () => {
    const aggregate = mockHistory();
    const result = await lastExerciseSets(user, [b]);
    const pipeline = aggregate.mock.calls[0].arguments[0];
    assert.equal(pipeline[0].$match.userId.toString(), user); assert.equal(pipeline[0].$match.deletedAt, null);
    assert.equal(pipeline[0].$match['exercises.exerciseId'].$in[0].toString(), b);
    assert.deepEqual(pipeline[3].$sort, { endedAt: -1, _id: -1 });
    assert.equal(pipeline[4].$group._id, '$exercises.exerciseId');
    assert.deepEqual(result.get(b).map(({ id, ...set }) => set), history);
    assert.equal(new Set(result.get(b).map(set => set.id)).size, 4);
    assert(result.get(b).every(set => !('isCompleted' in set)));
    const again = await lastExerciseSets(user, [b]); assert.notEqual(again.get(b)[0].id, result.get(b)[0].id);
});
test('selecting new exercises prefills history without changing an existing edited card', async () => {
    const value = draft(); mock.method(Draft, 'findOne', async () => value); mock.method(value, 'save', async () => value);
    mock.method(Exercise, 'find', async () => [exercise(a), exercise(b)]); const aggregate = mockHistory();
    const result = await service.updateWorkoutDraftExercises(draftId, { exerciseIds: [a,b] }, user);
    assert.equal(result.exercises[0].sets[0].weight, 20); assert.equal(result.exercises[0].sets[0].id, 'c893ecdf-ab47-44e2-af24-e051a730a78c');
    assert.equal(result.exercises[1].sets.length, 4); assert.equal(result.exercises[1].sets[0].isWarmup, true);
    assert.deepEqual(aggregate.mock.calls[0].arguments[0][0].$match['exercises.exerciseId'].$in.map(String), [b]);
});
test('template drafts bypass history; exercises without history retain default behavior', async () => {
    const value = draft('building', 'template'); mock.method(Draft, 'findOne', async () => value); mock.method(value, 'save', async () => value);
    mock.method(Exercise, 'find', async () => [exercise(b)]); const aggregate = mockHistory();
    let result = await service.updateWorkoutDraftExercises(draftId, { exerciseIds: [b] }, user);
    assert.equal(aggregate.mock.callCount(), 0); assert.equal(result.exercises[0].sets.length, 0);
    value.purpose = 'workout'; value.exercises = [];
    mock.method(Session, 'aggregate', async () => []);
    result = await service.updateWorkoutDraftExercises(draftId, { exerciseIds: [b] }, user); assert.equal(result.exercises[0].sets.length, 0);
});
test('adding during a workout prefills only newly added exercises and keeps existing sets intact', async () => {
    const value = draft('active'); mock.method(Draft, 'findOne', async () => value); mock.method(value, 'save', async () => value);
    mock.method(Exercise, 'find', async query => { assert.deepEqual(query._id.$in, [b]); return [exercise(b)]; }); mockHistory();
    const result = await service.addWorkoutDraftExercises(draftId, { exerciseIds: [a,b] }, user);
    assert.equal(result.exercises.length, 2); assert.equal(result.exercises[0].sets[0].reps, 12); assert.equal(result.exercises[1].sets.length, 4);
});
test('replacement updates only the targeted card in place, prefills history, and preserves a strength superset', async () => {
    const value = draft('active'); value.exercises[0].supersetId = 'pair';
    value.exercises.push({ exerciseId: c, exerciseName: 'Partner', supersetId: 'pair', sets: [{ weight: 5, reps: 8 }] });
    mock.method(Draft, 'findOne', async query => { assert.equal(query.userId, user); return value; });
    mock.method(Exercise, 'findOne', async query => { assert.equal(query._id, b); assert(query.$or); return exercise(b); }); mockHistory();
    let update;
    mock.method(Draft, 'findOneAndUpdate', async (query, change) => { assert.equal(query.status, 'active'); assert.equal(query.userId, user); assert(query.$expr); update = change; return value; });
    await service.replaceWorkoutDraftExercise(draftId, a, b, user);
    assert.deepEqual(Object.keys(update.$set), ['exercises.0']); assert.equal(update.$set['exercises.0'].supersetId, 'pair');
    assert.equal(update.$set['exercises.0'].sets.length, 4); assert.equal(update.$set['exercises.0'].cardioCompletion, undefined);
    assert.equal(value.exercises[1].sets[0].weight, 5);
});
test('cardio replacement clears incompatible pairing without importing strength sets or old completion', async () => {
    const value = draft('active'); value.exercises[0].supersetId = 'pair';
    value.exercises.push({ exerciseId: c, exerciseName: 'Partner', supersetId: 'pair', sets: [{ weight: 5, reps: 8 }] });
    mock.method(Draft, 'findOne', async () => value); mock.method(Exercise, 'findOne', async () => exercise(b, 'cardio')); const aggregate = mockHistory();
    let update; mock.method(Draft, 'findOneAndUpdate', async (_query, change) => { update = change; return value; });
    await service.replaceWorkoutDraftExercise(draftId, a, b, user);
    assert.equal(aggregate.mock.callCount(), 0); assert.deepEqual(update.$set['exercises.0'].sets, []);
    assert.deepEqual(update.$unset, { 'exercises.1.supersetId': 1 }); assert.equal(update.$set['exercises.0'].training.format, 'cardio');
});
test('replacement rejects duplicates, missing/inaccessible targets, ended workouts and concurrent reorder', async () => {
    const value = draft('active'); mock.method(Draft, 'findOne', async () => value);
    await assert.rejects(service.replaceWorkoutDraftExercise(draftId, a, a, user), /already/);
    await assert.rejects(service.replaceWorkoutDraftExercise(draftId, c, b, user), /not part/);
    mock.method(Exercise, 'findOne', async () => null); await assert.rejects(service.replaceWorkoutDraftExercise(draftId, a, b, user), /not available/);
    value.status = 'completed'; await assert.rejects(service.replaceWorkoutDraftExercise(draftId, a, b, user));
    value.status = 'active'; mock.method(Exercise, 'findOne', async () => exercise(b)); mockHistory();
    mock.method(Draft, 'findOneAndUpdate', async () => null); await assert.rejects(service.replaceWorkoutDraftExercise(draftId, a, b, user), /changed/);
    assert(!replaceWorkoutDraftExerciseSchema.safeParse({ replacementExerciseId: 'invalid' }).success);
});
