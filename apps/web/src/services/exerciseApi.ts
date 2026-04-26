import type {
    Equipment,
    Difficulty,
    ExerciseType,
    Muscle,
} from "@workout-app/shared";

import type { UpdateExerciseInput } from "@workout-app/shared";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

type CreateExerciseInput = {
    name: string;
    description?: string;
    instructions?: string;
    exerciseType?: ExerciseType;
    primaryMuscles?: Muscle[];
    secondaryMuscles?: Muscle[];
    equipment?: Equipment;
    difficulty?: Difficulty;
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

export async function getExerciseByIdRequest(exerciseId: string) {
    const response = await fetch(`${API_URL}/api/exercises/${exerciseId}`, {
        credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Failed to fetch exercise");
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

export async function updateExerciseRequest(
    exerciseId: string,
    exerciseData: UpdateExerciseInput,
) {
    const response = await fetch(`${API_URL}/api/exercises/${exerciseId}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(exerciseData),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Failed to update exercise");
    }

    return data;
}

export async function deleteExerciseRequest(exerciseId: string) {
    const response = await fetch(`${API_URL}/api/exercises/${exerciseId}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Failed to delete exercise");
    }

    return data;
}