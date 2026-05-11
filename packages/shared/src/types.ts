import type { Muscle } from "./constants/muscles";
import type { Equipment } from "./constants/equipment";
import type { ExerciseType } from "./constants/exercise";
import type { Difficulty } from "./constants/difficulty";

export type UserRole = "user" | "admin";

export type WorkoutSet = {
    weight: number;
    reps: number;
}

export type WorkoutSessionExercise = {
    exerciseId: string | null;
    exerciseName: string;
    sets: WorkoutSet[];
};


export type WorkoutSession = {
    _id: string;
    userId: string;
    exercises: WorkoutSessionExercise[];
    startedAt?: string | null;
    endedAt: string;
    createdAt: string;
    updatedAt: string;
};

export interface CreateExerciseInput {
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

export interface UpdateExerciseInput {
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

export interface ChangePasswordBody {
    currentPassword: string;
    newPassword: string;
}

export interface UpdateUserInput {
    name?: string;
    email?: string;
    username?: string;
}

export interface UpdateUserBody {
    name?: string;
    email?: string;
    username?: string;
}



export const muscleSearchAliases: Record<string, string[]> = {
    legs: ["quads", "hamstrings", "glutes", "calves"],
    arms: ["biceps", "triceps", "forearms"],
    push: ["chest", "shoulders", "triceps"],
    pull: ["back", "biceps"],
};