import { t } from "../i18n";
import { parseJsonResponse } from "../utils/parseJsonResponse";
import { workoutRequest } from "../utils/workoutRequest";
import { clearDraftSnapshots } from "../utils/workoutProgressStorage";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

import type { CreateWorkoutDraftInput } from "@workout-app/shared";



type UpdateWorkoutDraftExercisesInput = {
    exerciseIds: string[];
};

type UpdateWorkoutDraftSetsInput = {
    exerciseId: string;
    sets: {
        id?: string;
        isWarmup?: boolean;
        weight: string | number | null;
        reps: string | number | null;
    }[];
};

async function handleResponse(response: Response, fallbackMessage: string) {
    // Preserve successful draft decoding and the status used by persistence recovery.
    if (response.ok) return response.json();
    return parseJsonResponse(response, fallbackMessage);
}

export async function createWorkoutDraftRequest(
    draftData: CreateWorkoutDraftInput,
) {
    const response = await workoutRequest(`${API_URL}/api/workout-drafts`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(draftData),
    });

    return handleResponse(response, t("common.failedToCreateWorkoutDraft"));
}

export async function getCurrentWorkoutDraftRequest() {
    const response = await workoutRequest(`${API_URL}/api/workout-drafts/current`, {
        credentials: "include",
    });

    return handleResponse(response, t("workoutDraftApi.failedToFetchCurrentWorkoutDraft"));
}

export async function getWorkoutDraftByIdRequest(draftId: string, signal?: AbortSignal) {
    const response = await workoutRequest(`${API_URL}/api/workout-drafts/${draftId}`, {
        signal,
        credentials: "include",
    });

    return handleResponse(response, t("workoutDraftApi.failedToFetchWorkoutDraft"));
}

export async function updateWorkoutDraftExercisesRequest(
    draftId: string,
    exerciseData: UpdateWorkoutDraftExercisesInput,
) {
    const response = await workoutRequest(
        `${API_URL}/api/workout-drafts/${draftId}/exercises`,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(exerciseData),
        },
    );

    return handleResponse(response, t("workoutDraftApi.failedToUpdateWorkoutDraftExercises"));
}

export async function activateWorkoutDraftRequest(draftId: string) {
    try { return await startWorkoutDraftRequest(draftId); }
    catch (error) {
        const saved = await getWorkoutDraftByIdRequest(draftId).catch(() => null);
        if (saved?.status === "active") return saved;
        throw error;
    }
}

export async function startWorkoutDraftRequest(draftId: string) {
    const response = await workoutRequest(
        `${API_URL}/api/workout-drafts/${draftId}/start`,
        {
            method: "PATCH",
            credentials: "include",
        },
    );

    return handleResponse(response, t("workoutDraftApi.failedToStartWorkoutDraft"));
}

export async function updateWorkoutDraftSetsRequest(
    draftId: string,
    setData: UpdateWorkoutDraftSetsInput,
) {
    const response = await workoutRequest(
        `${API_URL}/api/workout-drafts/${draftId}/sets`,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(setData),
        },
    );

    return handleResponse(response, t("workoutDraftApi.failedToUpdateWorkoutDraftSets"));
}

export async function addWorkoutDraftExercisesRequest(
    draftId: string,
    exerciseData: UpdateWorkoutDraftExercisesInput,
) {
    const response = await workoutRequest(
        `${API_URL}/api/workout-drafts/${draftId}/exercises/add`,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(exerciseData),
        },
    );

    return handleResponse(response, t("workoutDraftApi.failedToAddExercisesToWorkout"));
}

export async function removeWorkoutDraftExerciseRequest(
    draftId: string,
    exerciseId: string,
) {
    const response = await workoutRequest(
        `${API_URL}/api/workout-drafts/${draftId}/exercises/${exerciseId}`,
        {
            method: "DELETE",
            credentials: "include",
        },
    );

    return handleResponse(response, t("workoutDraftApi.failedToRemoveExerciseFromWorkout"));
}

export async function completeWorkoutDraftRequest(draftId: string) {
    const response = await workoutRequest(
        `${API_URL}/api/workout-drafts/${draftId}/complete`,
        {
            method: "POST",
            credentials: "include",
        },
    );

    const result = await handleResponse(response, t("workoutDraftApi.failedToCompleteWorkoutDraft"));
    clearDraftSnapshots(draftId);
    return result;
}

export async function abandonWorkoutDraftRequest(draftId: string) {
    const response = await workoutRequest(
        `${API_URL}/api/workout-drafts/${draftId}/abandon`,
        {
            method: "PATCH",
            credentials: "include",
        },
    );

    const result = await handleResponse(response, t("workoutDraftApi.failedToAbandonWorkoutDraft"));
    clearDraftSnapshots(draftId);
    return result;
}

export async function reorderWorkoutDraftExercisesRequest(
    draftId: string,
    exerciseIds: string[],
) {
    const response = await workoutRequest(
        `${API_URL}/api/workout-drafts/${draftId}/exercises/order`,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ exerciseIds }),
        },
    );

    return handleResponse(response, t("workoutDraftApi.failedToReorderWorkoutExercises"));
}
export async function updateWorkoutDraftTrainingRequest(draftId: string, input: { exerciseId: string; training: import("@workout-app/shared").TrainingConfig; cardioCompletion?: import("@workout-app/shared").CardioCompletion }) {
    const response = await workoutRequest(`${API_URL}/api/workout-drafts/${draftId}/training`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
    return handleResponse(response, t("workoutDraftApi.failedToSaveTrainingConfiguration"));
}

export async function updateWorkoutSupersetsRequest(draftId: string, pairs: [string, string][]) {
    const response = await workoutRequest(`${API_URL}/api/workout-drafts/${draftId}/supersets`, {
        method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pairs }),
    });
    return handleResponse(response, t("workout.supersetSaveFailed"));
}
