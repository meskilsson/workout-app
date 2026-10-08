import type { TrainingConfig, CardioCompletion } from "./training";
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
    training?: TrainingConfig;
    cardioCompletion?: CardioCompletion;
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

export type Exercise = {
    _id: string;
    name: string;
    description?: string;
    instructions?: string;
    exerciseType?: "strength" | "cardio" | "mobility";
    primaryMuscles?: string[];
    secondaryMuscles?: string[];
    equipment?: string;
    difficulty?: "beginner" | "intermediate" | "advanced";
    videoUrl?: string;
    imageUrl?: string;
    isCustom: boolean;
    createdBy?: string | null;
    createdAt?: string;
    updatedAt?: string;
};

export type PaginatedExercisesResponse = {
    success: boolean;
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    exercises: Exercise[];
};

export type ExerciseSort = "name" | "popular" | "mostUsed";

export type GetExercisesParams = {
    includeCardio?: boolean;
    exerciseType?: ExerciseType;
    sort?: ExerciseSort;
    page?: number;
    limit?: number;
    search?: string;
    muscles?: string[];
}

export type GetExercisesOptions = {
    includeCardio?: boolean;
    exerciseType?: ExerciseType;
    sort?: ExerciseSort;
    page: number;
    limit: number;
    search?: string;
    muscles?: Muscle[],
};

export type WorkoutTemplateCategory =
    | "full_body"
    | "push"
    | "pull"
    | "legs"
    | "upper"
    | "lower"
    | "custom";

export type WorkoutTemplateSet = {
    reps?: number | null;
    weight?: number | null;
    restSeconds?: number | null;
    notes?: string;
};

export type WorkoutTemplateExercise = {
    _id: string;
    exercise: {
        _id: string;
        name: string;
        primaryMuscles?: string[];
        secondaryMuscles?: string[];
        equipment?: string;
        difficulty?: "beginner" | "intermediate" | "advanced";
        exerciseType?: "strength" | "cardio" | "mobility";
    };
    exerciseName: string;
    training?: TrainingConfig;
    order: number;
    plannedSets: WorkoutTemplateSet[];
};

export type WorkoutTemplate = {
    _id: string;
    name: string;
    description?: string;
    category: WorkoutTemplateCategory;
    isPublic: boolean;
    createdBy?: string | null;
    exercises: WorkoutTemplateExercise[];
    createdAt: string;
    updatedAt: string;
};

export type CreateWorkoutTemplateInput = {
    name: string;
    description?: string;
    category?: WorkoutTemplateCategory;
    exercises: {
        exerciseId: string;
        plannedSets?: WorkoutTemplateSet[];
        training?: TrainingConfig;
    }[];
};

export type UpdateWorkoutTemplateInput = Partial<CreateWorkoutTemplateInput>;


export type WorkoutDraftPurpose = "workout" | "template";

export type CreateWorkoutDraftInput = {
    includeCardio?: boolean;
    selectedMuscleGroups: string[];
    purpose?: WorkoutDraftPurpose;
};

export type CreateWorkoutTemplateFromDraftInput = {
    name: string;
    description?: string;
    category?: WorkoutTemplateCategory;
};

export type StartedWorkoutDraft = {
    includeCardio?: boolean;
    _id: string;
    userId: string;
    status: "building" | "active" | "completed" | "abandoned";
    purpose: "workout" | "template";
    selectedMuscleGroups: string[];
    exercises: {
        exerciseId: string;
        exerciseName: string;
        training?: TrainingConfig;
        cardioCompletion?: CardioCompletion;
        sets: {
            weight: number | null;
            reps: number | null;
        }[];
    }[];
    startedAt?: string | null;
    completedSessionId?: string | null;
    sourceTemplateId?: string | null;
    createdAt: string;
    updatedAt: string;
};

export type RepeatWorkoutDraftResponse = {
    _id: string;
    status: "building" | "active" | "completed" | "abandoned";
    purpose: "workout" | "template";
};
