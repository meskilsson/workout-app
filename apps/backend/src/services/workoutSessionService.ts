import { Types } from "mongoose";
import WorkoutSession from "../models/WorkoutSession";

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

function createHttpError(message: string, statusCode: number) {
    const error = new Error(message) as Error & { statusCode?: number };
    error.statusCode = statusCode;
    return error;
}

export async function createWorkoutSession(
    workoutData: CreateWorkoutSessionInput,
    userId: string,
) {
    if (!workoutData.exercises || workoutData.exercises.length === 0) {
        throw createHttpError("At least one exercise is required", 400);
    }

    const normalizedExercises = workoutData.exercises.map((exercise) => {
        const exerciseName = exercise.exerciseName?.trim();

        if (!exerciseName) {
            throw createHttpError("Exercise name is required", 400);
        }

        let normalizedExerciseId: Types.ObjectId | null = null;

        if (exercise.exerciseId) {
            if (!Types.ObjectId.isValid(exercise.exerciseId)) {
                throw createHttpError("Invalid exercise id", 400);
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
            throw createHttpError(
                `At least one valid set is required for ${exerciseName}`,
                400,
            );
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
        throw createHttpError("Invalid workout session id", 400);
    }

    const workoutSession = await WorkoutSession.findOne({
        _id: sessionId,
        userId,
    });

    if (!workoutSession) {
        throw createHttpError("Workout session not found", 404);
    }

    return workoutSession;
}