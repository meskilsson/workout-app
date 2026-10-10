import { getWorkoutDraftByIdRequest } from "../services/workoutDraftApi";
import { getMyWorkoutTemplateByIdRequest, getPublicWorkoutTemplateByIdRequest } from "../services/workoutTemplateApi";
import { queryOptions } from "@tanstack/react-query";
import type { GetExercisesParams } from "@workout-app/shared";
import { getExerciseByIdRequest, getExerciseLibraryRequest, getPublicExercisesRequest } from "../services/exerciseApi";
import { getMyWorkoutSessionsRequest, getWorkoutSessionByIdRequest } from "../services/workoutSessionApi";
import { exerciseKeys, sessionKeys, templateKeys, draftKeys } from "./queryClient";

export function exerciseListOptions(userId: string | undefined, params: GetExercisesParams) {
    return queryOptions({
        queryKey: exerciseKeys.list(userId, params),
        queryFn: ({ signal }) => userId
            ? getExerciseLibraryRequest(params, signal)
            : getPublicExercisesRequest(params, signal),
    });
}

export function exerciseDetailOptions(userId: string | undefined, id: string) {
    return queryOptions({
        queryKey: exerciseKeys.detail(userId, id),
        queryFn: ({ signal }) => getExerciseByIdRequest(id, !!userId, signal),
        enabled: !!id,
    });
}

export function sessionListOptions(userId: string) {
    return queryOptions({
        queryKey: sessionKeys.list(userId),
        queryFn: ({ signal }) => getMyWorkoutSessionsRequest(signal),
        enabled: !!userId,
    });
}

export function sessionDetailOptions(userId: string, id: string) {
    return queryOptions({
        queryKey: sessionKeys.detail(userId, id),
        queryFn: ({ signal }) => getWorkoutSessionByIdRequest(id, signal),
        enabled: !!userId && !!id,
    });
}

export function templateDetailOptions(source: "public" | "my", userId: string | undefined, id: string) {
    return queryOptions({
        queryKey: templateKeys.detail(source, userId, id),
        queryFn: ({ signal }) => source === "my"
            ? getMyWorkoutTemplateByIdRequest(id, signal)
            : getPublicWorkoutTemplateByIdRequest(id, signal),
        enabled: !!id && (source === "public" || !!userId),
    });
}

export function draftDetailOptions(userId: string, id: string) {
    return queryOptions({
        queryKey: draftKeys.detail(userId, id),
        queryFn: ({ signal }) => getWorkoutDraftByIdRequest(id, signal),
        enabled: !!userId && !!id,
        // Every entry must validate the backend before hydrating local progress.
        staleTime: 0,
        gcTime: 0,
        refetchOnReconnect: false,
        refetchOnWindowFocus: false,
    });
}
