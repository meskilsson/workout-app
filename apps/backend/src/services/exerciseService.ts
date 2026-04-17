import Exercise from "../models/Exercises";

interface CreateExerciseInput {
    name: string;
    description?: string;
    instructions?: string;
    exerciseType?: "strength" | "cardio" | "mobility";
    primaryMuscles?: string[];
    secondaryMuscles?: string[];
    equipment?: "bodyweight" | "dumbbell" | "barbell" | "machine" | "kettlebell" | "band";
    difficulty?: "beginner" | "intermediate" | "advanced";
    videoUrl?: string;
    imageUrl?: string;
};

function escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function createExercise(exerciseData: CreateExerciseInput, userId: string) {

    if (!exerciseData?.name?.trim()) {
        const error = new Error("Name is required") as Error & {
            statusCode?: number
        }
        error.statusCode = 400;
        throw error;
    }



    const name = exerciseData.name.trim();

    const description = exerciseData.description?.trim() || "";
    const instructions = exerciseData.instructions?.trim() || "";
    const videoUrl = exerciseData.videoUrl?.trim() || "";
    const imageUrl = exerciseData.imageUrl?.trim() || "";

    const primaryMuscles = exerciseData.primaryMuscles?.map(muscle => muscle.trim()).filter(Boolean) ?? [];
    const secondaryMuscles = exerciseData.secondaryMuscles?.map(muscle => muscle.trim()).filter(Boolean) ?? [];



    const existingExercise = await Exercise.findOne({
        createdBy: userId,
        name: {
            $regex: new RegExp(`^${escapeRegex(name)}$`, "i"),
        }
    });


    if (existingExercise) {
        const error = new Error("You already created an exercise with that name") as Error & {
            statusCode?: number
        }
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

