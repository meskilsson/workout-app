import type { Muscle } from "./constants/muscles";
import type { Equipment } from "./constants/equipment";
import type { ExerciseType } from "./constants/exercise";
import type { Difficulty } from "./constants/difficulty";

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
