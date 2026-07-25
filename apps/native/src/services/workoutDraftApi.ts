import { apiFetch } from "./apiClient";

export type Muscle =
    | "chest"
    | "back"
    | "shoulders"
    | "biceps"
    | "triceps"
    | "quads"
    | "hamstrings"
    | "glutes"
    | "calves"
    | "core"
    | "forearms";

export type WorkoutDraftSet = {
    weight: number | null;
    reps: number | null;
};

export type WorkoutDraftExercise = {
    exerciseId: string;
    exerciseName: string;
    sets: WorkoutDraftSet[];
};

export type WorkoutDraft = {
    _id: string;
    userId: string;
    status: "building" | "active" | "completed" | "abandoned";
    purpose: "workout" | "template";
    selectedMuscleGroups: Muscle[];
    exercises: WorkoutDraftExercise[];
    startedAt?: string | null;
    completedSessionId?: string | null;
    createdAt: string;
    updatedAt: string;
};

export async function createWorkoutDraftRequest(
    token: string,
    selectedMuscleGroups: Muscle[],
) {
    return apiFetch<WorkoutDraft>("/api/workout-drafts", {
        method: "POST",
        token,
        body: JSON.stringify({
            selectedMuscleGroups,
            purpose: "workout",
        }),
    });
}

export async function getCurrentWorkoutDraftRequest(token: string) {
    return apiFetch<WorkoutDraft | null>("/api/workout-drafts/current", {
        method: "GET",
        token,
    });
}

export async function updateWorkoutDraftExercisesRequest(
    token: string,
    draftId: string,
    exerciseIds: string[],
) {
    return apiFetch<WorkoutDraft>(`/api/workout-drafts/${draftId}/exercises`, {
        method: "PATCH",
        token,
        body: JSON.stringify({
            exerciseIds,
        }),
    });
}

export async function startWorkoutDraftRequest(
    token: string,
    draftId: string,
) {
    return apiFetch<WorkoutDraft>(`/api/workout-drafts/${draftId}/start`, {
        method: "PATCH",
        token,
    });
}

