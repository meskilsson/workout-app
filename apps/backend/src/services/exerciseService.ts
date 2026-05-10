import Exercise from "../models/Exercises";
import type {
    Muscle,
    Equipment,
    Difficulty,
    ExerciseType,
} from "@workout-app/shared";
import { Types } from "mongoose";
import { ConflictError, ValidationError, NotFoundError, ForbiddenError } from "../errors/AppError";

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
        throw new ValidationError("Name is required");
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
        throw new ConflictError("You already created an exercise with that name");
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
        throw new ValidationError("Invalid exercise id");
    }

    const exercise = await Exercise.findById(id);

    if (!exercise) {
        throw new NotFoundError("Exercise not found");
    }

    if (!exercise.isCustom || !exercise.createdBy) {
        throw new ForbiddenError("Public exercises cannot be updated");
    }

    if (exercise.createdBy.toString() !== userId) {
        throw new ForbiddenError("You can only update your own exercises");
    }

    if (exerciseData.name !== undefined) {
        const trimmedName = exerciseData.name.trim();

        if (!trimmedName) {
            throw new ValidationError("Name is required");
        }

        const existingExercise = await Exercise.findOne({
            _id: { $ne: exercise._id },
            createdBy: userId,
            name: {
                $regex: new RegExp(`^${escapeRegex(trimmedName)}$`, "i"),
            },
        });

        if (existingExercise) {
            throw new ConflictError("You already created an exercise with that name");
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
        throw new ValidationError("Invalid exercise id");
    }

    const exercise = await Exercise.findById(id);

    if (!exercise) {
        throw new NotFoundError("Exercise not found");
    }

    if (!exercise.isCustom || !exercise.createdBy) {
        throw new ForbiddenError("Public exercises cannot be deleted");
    }

    if (exercise.createdBy.toString() !== userId) {
        throw new ForbiddenError("You can only delete your own exercises");
    }

    await Exercise.findByIdAndDelete(id);

    return {
        message: "Exercise deleted successfully",
        deletedExerciseId: id,
    };
}