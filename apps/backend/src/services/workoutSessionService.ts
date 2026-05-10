import { Types } from "mongoose";
import WorkoutSession from "../models/WorkoutSession";
import { NotFoundError, ValidationError } from "../errors/AppError";

interface CreateWorkoutSessionInput {
    exercises: {
        exerciseId?: string | null;
        exerciseName: string;
        sets: {
            weight: string | number;
            reps: string | number;
        }[];
    }[];
    startedAt?: string;
    endedAt?: string;
}


export async function createWorkoutSession(
    workoutData: CreateWorkoutSessionInput,
    userId: string,
) {
    if (!workoutData.exercises || workoutData.exercises.length === 0) {
        throw new ValidationError("At least one exercise is required");
    }

    const normalizedExercises = workoutData.exercises.map((exercise) => {
        const exerciseName = exercise.exerciseName?.trim();

        if (!exerciseName) {
            throw new ValidationError("Exercise name is required");
        }

        let normalizedExerciseId: Types.ObjectId | null = null;

        if (exercise.exerciseId) {
            if (!Types.ObjectId.isValid(exercise.exerciseId)) {
                throw new ValidationError("Invalid exercise id");
            }

            normalizedExerciseId = new Types.ObjectId(exercise.exerciseId);
        }

        const normalizedSets = (exercise.sets ?? [])
            .map((set) => ({
                weight: Number(set.weight),
                reps: Number(set.reps),
            }))
            .filter(
                (set) =>
                    Number.isFinite(set.weight) &&
                    set.weight >= 0 &&
                    Number.isFinite(set.reps) &&
                    set.reps > 0,
            );

        if (normalizedSets.length === 0) {
            throw new ValidationError(`At least one valid set is required for ${exerciseName}`);
        }

        return {
            exerciseId: normalizedExerciseId,
            exerciseName,
            sets: normalizedSets,
        };
    });

    const startedAt =
        workoutData.startedAt && !Number.isNaN(new Date(workoutData.startedAt).getTime())
            ? new Date(workoutData.startedAt)
            : null;

    const endedAt =
        workoutData.endedAt && !Number.isNaN(new Date(workoutData.endedAt).getTime())
            ? new Date(workoutData.endedAt)
            : new Date();

    const workoutSession = await WorkoutSession.create({
        userId,
        exercises: normalizedExercises,
        startedAt,
        endedAt,
    });

    return workoutSession;
}

export async function getMyWorkoutSessions(userId: string) {
    return WorkoutSession.find({ userId }).sort({ endedAt: -1 });
}

export async function getWorkoutSessionById(sessionId: string, userId: string) {
    if (!Types.ObjectId.isValid(sessionId)) {
        throw new ValidationError("Invalid workout session id");
    }

    const workoutSession = await WorkoutSession.findOne({
        _id: sessionId,
        userId,
    });

    if (!workoutSession) {
        throw new NotFoundError("Workout session not found");
    }

    return workoutSession;
}