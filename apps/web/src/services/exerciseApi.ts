import type { Muscle } from "../constants/muscles";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";


type CreateExerciseInput = {
    name: string;
    description?: string;
    instructions?: string;
    exerciseType?: "strength" | "cardio" | "mobility";
    primaryMuscles?: Muscle[];
    secondaryMuscles?: Muscle[];
    equipment?: "bodyweight" | "dumbbell" | "barbell" | "machine" | "kettlebell" | "band";
    difficulty?: "beginner" | "intermediate" | "advanced";
};

export async function getPublicExercisesRequest() {
    const response = await fetch(`${API_URL}/api/exercises`);

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Failed to fetch public exercises");
    }

    return data;
}

export async function getExerciseLibraryRequest() {
    const response = await fetch(`${API_URL}/api/exercises/library`, {
        credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Failed to fetch exercise library");
    }

    return data;
}

export async function createExerciseRequest(exerciseData: CreateExerciseInput) {
    const response = await fetch(`${API_URL}/api/exercises`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(exerciseData),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Failed to create exercise");
    }

    return data;
}