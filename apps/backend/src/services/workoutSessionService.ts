import { Types } from "mongoose";
import type { Muscle } from "@workout-app/shared";

import WorkoutSession from "../models/WorkoutSession";
import WorkoutDraft from "../models/WorkoutDraft";
import Exercise from "../models/Exercises";

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
            : undefined;

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
    if (!Types.ObjectId.isValid(userId)) {
        throw new ValidationError("Invalid user id");
    }

    return WorkoutSession.find({
        userId,
        deletedAt: null,
    }).sort({ endedAt: -1 });
}

export async function getWorkoutSessionById(sessionId: string, userId: string) {
    if (!Types.ObjectId.isValid(sessionId)) {
        throw new ValidationError("Invalid workout session id");
    }

    if (!Types.ObjectId.isValid(userId)) {
        throw new ValidationError("Invalid user id");
    }

    const workoutSession = await WorkoutSession.findOne({
        _id: sessionId,
        userId,
        deletedAt: null,
    });

    if (!workoutSession) {
        throw new NotFoundError("Workout session not found");
    }

    return workoutSession;
}

export async function repeatWorkoutSession(
    sessionId: string,
    userId: string,
) {
    if (!Types.ObjectId.isValid(sessionId)) {
        throw new ValidationError("Invalid workout session id");
    }

    if (!Types.ObjectId.isValid(userId)) {
        throw new ValidationError("Invalid workout session id");
    }

    const workoutSession = await WorkoutSession.findOne({
        _id: sessionId,
        userId,
        deletedAt: null,
    });

    if (!workoutSession) {
        throw new NotFoundError("Workout session not found");
    }

    if (workoutSession.exercises.length === 0) {
        throw new ValidationError("Cannot train again from an empty workout");
    }

    const missingExerciseName = workoutSession.exercises
        .filter((sessionExercise) => !sessionExercise.exerciseId)
        .map((sessionExercise) => sessionExercise.exerciseName);

    if (missingExerciseName.length > 0) {
        throw new ValidationError(`Cannot train again because these exercises are missing an exercise id: ${missingExerciseName.join(", ")}`);
    }

    const exerciseIds = workoutSession.exercises.map((sessionExercise) =>
        sessionExercise.exerciseId!.toString(),
    );

    const avaliableExercises = await Exercise.find({
        _id: { $in: exerciseIds },
        deletedAt: null,
        $or: [
            {
                isCustom: false,
                createdBy: null,
            },
            {
                createdBy: userId,
            },
        ],
    });

    const availableExercisesMap = new Map(
        avaliableExercises.map((exercise) => [exercise.id, exercise]),
    );

    const unavailableExerciseNames = workoutSession.exercises
        .filter((sessionExercise) => {
            if (!sessionExercise.exerciseId) return true;

            return !availableExercisesMap.has(
                sessionExercise.exerciseId.toString(),
            );
        })
        .map((sessionExercise) => sessionExercise.exerciseName);

    if (unavailableExerciseNames.length > 0) {
        throw new ValidationError(`Cannot train again because these exercise no longer exist or are not available: ${unavailableExerciseNames.join(", ")}`);
    }

    await WorkoutDraft.updateMany(
        {
            userId,
            purpose: "workout",
            status: { $in: ["building", "active"] },
        },
        {
            $set: {
                status: "abandoned",
            },
        },
    );

    const selectedMuscleGroups = new Set<Muscle>();

    const draftExercises = workoutSession.exercises.map((sessionExercise) => {
        const exerciseId = sessionExercise.exerciseId!.toString();
        const exercise = availableExercisesMap.get(exerciseId);

        if (!exercise) {
            throw new ValidationError(
                `Exercise could not be found: ${sessionExercise.exerciseName}`,
            );
        }

        for (const muscle of exercise.primaryMuscles ?? []) {
            selectedMuscleGroups.add(muscle);
        }

        return {
            exerciseId: new Types.ObjectId(exercise.id),
            exerciseName: sessionExercise.exerciseName || exercise.name,
            sets: sessionExercise.sets.map((set) => ({
                weight: set.weight ?? null,
                reps: set.reps ?? null,
            })),
        };
    });

    const draft = await WorkoutDraft.create({
        userId,
        status: "building",
        purpose: "workout",
        selectedMuscleGroups: Array.from(selectedMuscleGroups),
        exercises: draftExercises,
        sourceSessionId: workoutSession._id,
    });


    return draft;
}

export async function deleteWorkoutSession(
    sessionId: string,
    userId: string,
) {
    if (!Types.ObjectId.isValid(sessionId)) {
        throw new ValidationError("Invalid workout session id");
    }

    if (!Types.ObjectId.isValid(userId)) {
        throw new ValidationError("Invalid user id");
    }

    const session = await WorkoutSession.findOneAndUpdate(
        {
            _id: sessionId,
            userId,
            deletedAt: null,
        },
        {
            $set: {
                deletedAt: new Date(),
                deletedBy: userId,
                deleteReason: "Deleted by user",
            },
        },
        {
            new: true,
        },
    );

    if (!session) {
        throw new NotFoundError("Workout session not found");
    }

    return session;
}