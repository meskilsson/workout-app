import { randomUUID } from 'node:crypto';
import { Types } from 'mongoose';
import WorkoutSession from '../models/WorkoutSession';
import type { WorkoutDraftSet } from '../models/WorkoutDraft';

/** One history query for newly added strength exercises, scoped to this user. */
export async function lastExerciseSets(userId: string, exerciseIds: string[]): Promise<Map<string, WorkoutDraftSet[]>> {
    if (!exerciseIds.length) return new Map();
    const ids = exerciseIds.map(id => new Types.ObjectId(id));
    const history = await WorkoutSession.aggregate<{ _id: Types.ObjectId; sets: WorkoutDraftSet[] }>([
        { $match: { userId: new Types.ObjectId(userId), deletedAt: null, 'exercises.exerciseId': { $in: ids } } },
        { $unwind: '$exercises' },
        { $match: { 'exercises.exerciseId': { $in: ids }, 'exercises.sets.0': { $exists: true },
            $or: [{ 'exercises.training.format': 'strength' }, { 'exercises.training.format': { $exists: false } }] } },
        { $sort: { endedAt: -1, _id: -1 } },
        { $group: { _id: '$exercises.exerciseId', sets: { $first: '$exercises.sets' } } },
    ]);
    return new Map(history.map(entry => [entry._id.toString(), entry.sets
        .filter(set => typeof set.weight === 'number' && Number.isFinite(set.weight) && set.weight >= 0
            && typeof set.reps === 'number' && Number.isFinite(set.reps) && set.reps >= 1)
        .map(set => ({ id: randomUUID(), weight: set.weight, reps: set.reps, ...(set.isWarmup !== undefined ? { isWarmup: set.isWarmup } : {}) }))]));
}
