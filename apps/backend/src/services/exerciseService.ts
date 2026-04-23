import Exercise from "../models/Exercises";
import type { Muscle } from "../constants/muscles";

interface CreateExerciseInput {
    name: string;
    description?: string;
    instructions?: string;
    exerciseType?: "strength" | "cardio" | "mobility";
    primaryMuscles?: Muscle[];
    secondaryMuscles?: Muscle[];
    equipment?: "bodyweight" | "dumbbell" | "barbell" | "machine" | "kettlebell" | "band";
    difficulty?: "beginner" | "intermediate" | "advanced";
    videoUrl?: string;
    imageUrl?: string;
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

    const primaryMuscles =
        exerciseData.primaryMuscles?.map((muscle) => muscle.trim()).filter(Boolean) ?? [];

    const secondaryMuscles =
        exerciseData.secondaryMuscles?.map((muscle) => muscle.trim()).filter(Boolean) ?? [];

    const existingExercise = await Exercise.findOne({
        createdBy: userId,
        name: {
            $regex: new RegExp(`^${escapeRegex(name)}$`, "i"),
        },
    });

    if (existingExercise) {
        const error = new Error("You already created an exercise with that name") as Error & {
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
};

export async function getPublicExercises() {
    const exercises = await Exercise.find({
        isCustom: false,
        createdBy: null,
    }).sort({ name: 1 });

    return exercises;
}

export async function getExerciseLibrary(userId: string) {
    const exercises = await Exercise.find({
        $or: [
            { isCustom: false, createdBy: null },
            { createdBy: userId },
        ],
    }).sort({ name: 1 });

    return exercises;
}


export async function getExerciseById(id: string) {
    const exercise = await Exercise.findById(id);

    if (!exercise) {
        const error = new Error("Exercise not found") as Error & {
            statusCode?: number;
        }

        error.statusCode = 404;
        throw error;
    }

    return exercise;
}