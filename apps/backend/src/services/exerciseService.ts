import Exercise from "../models/Exercises";
import type {
    Muscle,
    Equipment,
    Difficulty,
    ExerciseType,
} from "@workout-app/shared";
import { Types } from "mongoose";
import { createHttpError } from "../utils/createHttpError";

interface CreateExerciseInput {
    name: string;
    description?: string;
    instructions?: string;
    exerciseType?: ExerciseType;
    primaryMuscles?: Muscle[];
    secondaryMuscles?: Muscle[];
    equipment?: Equipment;
    difficulty?: Difficulty;
    videoUrl?: string;
    imageUrl?: string;
}

interface UpdateExerciseInput {
    name?: string;
    description?: string;
    instructions?: string;
    exerciseType?: ExerciseType;
    primaryMuscles?: Muscle[];
    secondaryMuscles?: Muscle[];
    equipment?: Equipment;
    difficulty?: Difficulty;
    videoUrl?: string;
    imageUrl: string;
}

function escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function createExercise(
    exerciseData: CreateExerciseInput,
    userId: string,
) {
    if (!exerciseData?.name?.trim()) {
        const error = new Error("Name is required") as Error & {
            statusCode?: number;
        };
        error.statusCode = 400;
        throw error;
    }

    const name = exerciseData.name.trim();
    const description = exerciseData.description?.trim() || "";
    const instructions = exerciseData.instructions?.trim() || "";
    const videoUrl = exerciseData.videoUrl?.trim() || "";
    const imageUrl = exerciseData.imageUrl?.trim() || "";

    const primaryMuscles = exerciseData.primaryMuscles ?? [];
    const secondaryMuscles = exerciseData.secondaryMuscles ?? [];

    const existingExercise = await Exercise.findOne({
        createdBy: userId,
        name: {
            $regex: new RegExp(`^${escapeRegex(name)}$`, "i"),
        },
    });

    if (existingExercise) {
        const error = new Error(
            "You already created an exercise with that name",
        ) as Error & {
            statusCode?: number;
        };
        error.statusCode = 409;
        throw error;
    }

    const exercise = await Exercise.create({
        name,
        description,
        instructions,
        exerciseType: exerciseData.exerciseType,
        primaryMuscles,
        secondaryMuscles,
        equipment: exerciseData.equipment,
        difficulty: exerciseData.difficulty,
        videoUrl,
        imageUrl,
        isCustom: true,
        createdBy: userId,
    });

    return exercise;
}

export async function getPublicExercises() {
    const exercises = await Exercise.find({
        isCustom: false,
        createdBy: null,
    }).sort({ name: 1 });

    return exercises;
}

export async function getExerciseLibrary(userId: string) {
    const exercises = await Exercise.find({
        $or: [{ isCustom: false, createdBy: null }, { createdBy: userId }],
    }).sort({ name: 1 });

    return exercises;
}

export async function getExerciseById(id: string) {
    const exercise = await Exercise.findById(id);

    if (!exercise) {
        const error = new Error("Exercise not found") as Error & {
            statusCode?: number;
        };
        error.statusCode = 404;
        throw error;
    }

    return exercise;
}

export async function updateExercise(
    id: string,
    exerciseData: UpdateExerciseInput,
    userId: string,
) {
    if (!Types.ObjectId.isValid(id)) {
        throw createHttpError("Invalid exercise id", 400);
    }

    const exercise = await Exercise.findById(id);

    if (!exercise) {
        throw createHttpError("Exercise not found", 404);
    }

    if (!exercise.isCustom || !exercise.createdBy) {
        throw createHttpError("Public exercises cannot be updated", 403);
    }

    if (exercise.createdBy.toString() !== userId) {
        throw createHttpError("You can only update your own exercises", 403);
    }

    if (exerciseData.name !== undefined) {
        const trimmedName = exerciseData.name.trim();

        if (!trimmedName) {
            throw createHttpError("Name is required", 400);
        }

        const existingExercise = await Exercise.findOne({
            _id: { $ne: exercise._id },
            createdBy: userId,
            name: {
                $regex: new RegExp(`^${escapeRegex(trimmedName)}$`, "i"),
            },
        });

        if (existingExercise) {
            throw createHttpError(
                "You already created an exercise with that name",
                409,
            );
        }

        exercise.name = trimmedName;
    }

    if (exerciseData.description !== undefined) {
        exercise.description = exerciseData.description.trim();
    }

    if (exerciseData.instructions !== undefined) {
        exercise.instructions = exerciseData.instructions.trim();
    }

    if (exerciseData.exerciseType !== undefined) {
        exercise.exerciseType = exerciseData.exerciseType;
    }

    if (exerciseData.primaryMuscles !== undefined) {
        exercise.primaryMuscles = exerciseData.primaryMuscles;
    }

    if (exerciseData.secondaryMuscles !== undefined) {
        exercise.secondaryMuscles = exerciseData.secondaryMuscles;
    }

    if (exerciseData.equipment !== undefined) {
        exercise.equipment = exerciseData.equipment;
    }

    if (exerciseData.difficulty !== undefined) {
        exercise.difficulty = exerciseData.difficulty;
    }

    if (exerciseData.videoUrl !== undefined) {
        exercise.videoUrl = exerciseData.videoUrl.trim();
    }

    if (exerciseData.imageUrl !== undefined) {
        exercise.imageUrl = exerciseData.imageUrl.trim();
    }

    await exercise.save();

    return exercise;
}

export async function deleteExercise(id: string, userId: string) {
    if (!Types.ObjectId.isValid(id)) {
        throw createHttpError("Invalid exercise id", 400);
    }

    const exercise = await Exercise.findById(id);

    if (!exercise) {
        throw createHttpError("Exercise not found", 404);
    }

    if (!exercise.isCustom || !exercise.createdBy) {
        throw createHttpError("Public exercises cannot be deleted", 403);
    }

    if (exercise.createdBy.toString() !== userId) {
        throw createHttpError("You can only delete your own exercises", 403);
    }

    await Exercise.findByIdAndDelete(id);

    return {
        message: "Exercise deleted successfully",
        deletedExerciseId: id,
    };
}