import { apiFetch } from "../utils/apiFetch";
import { t } from "../i18n";
import { activateWorkoutDraftRequest } from "./workoutDraftApi";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

import type { RepeatWorkoutDraftResponse, WorkoutSession } from "@workout-app/shared";
import { parseJsonResponse } from "../utils/parseJsonResponse";

type WorkoutSessionSet = {
    weight: string | number;
    reps: string | number;
};

type WorkoutSessionExerciseInput = {
    exerciseId?: string | null;
    exerciseName: string;
    sets: WorkoutSessionSet[];
};

type CreateWorkoutSessionInput = {
    exercises: WorkoutSessionExerciseInput[];
    startedAt?: string;
    endedAt?: string;
};

export async function createWorkoutSessionRequest(
    sessionData: CreateWorkoutSessionInput,
) {
    const response = await apiFetch(`${API_URL}/api/workout-sessions`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(sessionData),
    });

    return parseJsonResponse<WorkoutSession>(response, t("workoutSessionApi.failedToSaveWorkoutSession"));
}

export async function getMyWorkoutSessionsRequest(signal?: AbortSignal): Promise<WorkoutSession[]> {
    const response = await apiFetch(`${API_URL}/api/workout-sessions/me`, {
        signal,
        credentials: "include",
    });

    return parseJsonResponse<WorkoutSession[]>(response, t("workoutSessionApi.failedToFetchWorkoutHistory"));
}

export async function getWorkoutSessionByIdRequest(sessionId: string, signal?: AbortSignal): Promise<WorkoutSession> {
    const response = await apiFetch(`${API_URL}/api/workout-sessions/${sessionId}`, {
        signal,
        credentials: "include",
    });

    return parseJsonResponse<WorkoutSession>(response, t("workoutSessionApi.failedToFetchWorkoutSession"));
}

export async function repeatWorkoutSessionRequest(
    sessionId: string,
): Promise<RepeatWorkoutDraftResponse> {
    const response = await apiFetch(`${API_URL}/api/workout-sessions/${sessionId}/repeat`,
        {
            method: "POST",
            credentials: "include",
        }
    );

    const draft = await parseJsonResponse<RepeatWorkoutDraftResponse>(
        response,
        t("workoutSessionApi.failedToPrepareWorkout"),
    );
    return activateWorkoutDraftRequest(draft._id);
}

export async function deleteWorkoutSessionRequest(
    sessionId: string,
): Promise<WorkoutSession> {
    const response = await apiFetch(
        `${API_URL}/api/workout-sessions/${sessionId}`,
        {
            method: "DELETE",
            credentials: "include",
        },
    );

    return parseJsonResponse<WorkoutSession>(
        response,
        t("workoutSessionApi.failedToDeleteWorkoutSession"),
    );
}
