import { apiFetch } from "../utils/apiFetch";
import { t } from "../i18n";
import type {
    PaginatedExercisesResponse,
    GetExercisesParams,
    CreateExerciseInput,
    UpdateExerciseInput,
    Exercise
} from "@workout-app/shared";

import { parseJsonResponse } from "../utils/parseJsonResponse";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function buildExerciseQueryParams({
    page = 1,
    limit = 10,
    search = "",
    muscles = [],
    sort = "name",
    exerciseType,
    equipment,
    difficulty,
    includeCardio,
}: GetExercisesParams) {
    const params = new URLSearchParams();

    params.set("page", String(page));
    params.set("limit", String(limit));
    params.set("sort", sort);
    if (equipment) params.set("equipment", equipment);
    if (difficulty) params.set("difficulty", difficulty);
    if (exerciseType) params.set("exerciseType", exerciseType);
    if (includeCardio !== undefined) params.set("includeCardio", String(includeCardio));

    if (search.trim()) {
        params.set("search", search.trim());
    }

    if (muscles.length > 0) {
        params.set("muscles", muscles.join(","));
    }

    return params;
}

export async function getPublicExercisesRequest(
    params: GetExercisesParams,
    signal?: AbortSignal,
): Promise<PaginatedExercisesResponse> {
    const queryParams = buildExerciseQueryParams(params);

    const response = await apiFetch(
        `${API_URL}/api/exercises?${queryParams.toString()}`,
        { signal },
    );

    return parseJsonResponse<PaginatedExercisesResponse>(
        response,
        t("exerciseApi.failedToFetchPublicExercises"),
    );
}

export async function getExerciseLibraryRequest(
    params: GetExercisesParams,
    signal?: AbortSignal,
): Promise<PaginatedExercisesResponse> {
    const queryParams = buildExerciseQueryParams(params);

    const response = await apiFetch(
        `${API_URL}/api/exercises/library?${queryParams.toString()}`,
        {
            signal,
            credentials: "include",
        },
    );

    return parseJsonResponse<PaginatedExercisesResponse>(
        response,
        t("exerciseApi.failedToFetchExerciseLibrary"),
    );
}

export async function getPublicExerciseByIdRequest(
    exerciseId: string,
    signal?: AbortSignal,
): Promise<Exercise> {
    const response = await apiFetch(`${API_URL}/api/exercises/${exerciseId}`, { signal });

    return parseJsonResponse<Exercise>(
        response,
        t("common.failedToFetchExercise"),
    );
}

export async function getLibraryExerciseByIdRequest(
    exerciseId: string,
    signal?: AbortSignal,
): Promise<Exercise> {
    const response = await apiFetch(`${API_URL}/api/exercises/library/${exerciseId}`, {
        signal,
        credentials: "include",
    });

    return parseJsonResponse<Exercise>(
        response,
        t("common.failedToFetchExercise"),
    );
}

export async function getExerciseByIdRequest(
    exerciseId: string,
    isAuthenticated = false,
    signal?: AbortSignal,
): Promise<Exercise> {
    if (isAuthenticated) {
        return getLibraryExerciseByIdRequest(exerciseId, signal);
    }

    return getPublicExerciseByIdRequest(exerciseId, signal);
}

export async function createExerciseRequest(
    exerciseData: CreateExerciseInput,
) {
    const response = await apiFetch(`${API_URL}/api/exercises`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(exerciseData),
    });

    return parseJsonResponse(
        response,
        t("exerciseApi.failedToCreateExercise"),
    );
}

export async function updateExerciseRequest(
    exerciseId: string,
    exerciseData: UpdateExerciseInput,
) {
    const response = await apiFetch(`${API_URL}/api/exercises/${exerciseId}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(exerciseData),
    });

    return parseJsonResponse(
        response,
        t("exerciseApi.failedToUpdateExercise"),
    );
}

export async function deleteExerciseRequest(exerciseId: string) {
    const response = await apiFetch(`${API_URL}/api/exercises/${exerciseId}`, {
        method: "DELETE",
        credentials: "include",
    });

    return parseJsonResponse<{ message: string; deletedExerciseId?: string }>(
        response,
        t("common.failedToDeleteExercise"),
    );
}
