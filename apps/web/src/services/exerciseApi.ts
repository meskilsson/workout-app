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
    includeCardio,
}: GetExercisesParams) {
    const params = new URLSearchParams();

    params.set("page", String(page));
    params.set("limit", String(limit));
    params.set("sort", sort);
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
): Promise<PaginatedExercisesResponse> {
    const queryParams = buildExerciseQueryParams(params);

    const response = await fetch(
        `${API_URL}/api/exercises?${queryParams.toString()}`,
    );

    return parseJsonResponse<PaginatedExercisesResponse>(
        response,
        "Failed to fetch public exercises",
    );
}

export async function getExerciseLibraryRequest(
    params: GetExercisesParams,
): Promise<PaginatedExercisesResponse> {
    const queryParams = buildExerciseQueryParams(params);

    const response = await fetch(
        `${API_URL}/api/exercises/library?${queryParams.toString()}`,
        {
            credentials: "include",
        },
    );

    return parseJsonResponse<PaginatedExercisesResponse>(
        response,
        "Failed to fetch exercise library",
    );
}

export async function getPublicExerciseByIdRequest(
    exerciseId: string,
): Promise<Exercise> {
    const response = await fetch(`${API_URL}/api/exercises/${exerciseId}`);

    return parseJsonResponse<Exercise>(
        response,
        "Failed to fetch exercise",
    );
}

export async function getLibraryExerciseByIdRequest(
    exerciseId: string,
): Promise<Exercise> {
    const response = await fetch(`${API_URL}/api/exercises/library/${exerciseId}`, {
        credentials: "include",
    });

    return parseJsonResponse<Exercise>(
        response,
        "Failed to fetch exercise",
    );
}

export async function getExerciseByIdRequest(
    exerciseId: string,
    isAuthenticated = false,
): Promise<Exercise> {
    if (isAuthenticated) {
        return getLibraryExerciseByIdRequest(exerciseId);
    }

    return getPublicExerciseByIdRequest(exerciseId);
}

export async function createExerciseRequest(
    exerciseData: CreateExerciseInput,
) {
    const response = await fetch(`${API_URL}/api/exercises`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(exerciseData),
    });

    return parseJsonResponse(
        response,
        "Failed to create exercise",
    );
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

    return parseJsonResponse(
        response,
        "Failed to update exercise",
    );
}

export async function deleteExerciseRequest(exerciseId: string) {
    const response = await fetch(`${API_URL}/api/exercises/${exerciseId}`, {
        method: "DELETE",
        credentials: "include",
    });

    return parseJsonResponse<{ message: string; deletedExerciseId?: string }>(
        response,
        "Failed to delete exercise",
    );
}
