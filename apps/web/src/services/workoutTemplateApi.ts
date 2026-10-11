import { t } from "../i18n";
import { activateWorkoutDraftRequest } from "./workoutDraftApi";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
import type {
    WorkoutTemplate,
    CreateWorkoutTemplateInput,
    UpdateWorkoutTemplateInput,
    StartedWorkoutDraft,
    CreateWorkoutTemplateFromDraftInput,
} from "@workout-app/shared";

import { parseJsonResponse } from "../utils/parseJsonResponse";

export async function getPublicWorkoutTemplatesRequest(signal?: AbortSignal): Promise<
    WorkoutTemplate[]
> {
    const response = await fetch(`${API_URL}/api/workout-templates/public`, { signal });

    return parseJsonResponse<WorkoutTemplate[]>(
        response,
        t("workoutTemplateApi.failedToFetchPublicWorkoutTemplates"),
    );
}

export async function getPublicWorkoutTemplateByIdRequest(
    templateId: string,
    signal?: AbortSignal,
): Promise<WorkoutTemplate> {
    const response = await fetch(
        `${API_URL}/api/workout-templates/public/${templateId}`,
        { signal },
    );

    return parseJsonResponse<WorkoutTemplate>(
        response,
        t("workoutTemplateApi.failedToFetchPublicWorkoutTemplate"),
    );
}

export async function getMyWorkoutTemplatesRequest(signal?: AbortSignal): Promise<WorkoutTemplate[]> {
    const response = await fetch(`${API_URL}/api/workout-templates/my`, {
        signal,
        credentials: "include",
    });

    return parseJsonResponse<WorkoutTemplate[]>(
        response,
        t("workoutTemplateApi.failedToFetchYourWorkoutTemplates"),
    );
}

export async function getMyWorkoutTemplateByIdRequest(
    templateId: string,
    signal?: AbortSignal,
): Promise<WorkoutTemplate> {
    const response = await fetch(
        `${API_URL}/api/workout-templates/my/${templateId}`,
        {
            signal,
            credentials: "include",
        },
    );

    return parseJsonResponse<WorkoutTemplate>(
        response,
        t("workoutTemplateApi.failedToFetchYourWorkoutTemplate"),
    );
}

export async function createWorkoutTemplateRequest(
    templateData: CreateWorkoutTemplateInput,
): Promise<WorkoutTemplate> {
    const response = await fetch(`${API_URL}/api/workout-templates`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(templateData),
    });

    return parseJsonResponse<WorkoutTemplate>(
        response,
        t("workoutTemplateApi.failedToCreateWorkoutTemplate"),
    );
}

export async function updateWorkoutTemplateRequest(
    templateId: string,
    templateData: UpdateWorkoutTemplateInput,
): Promise<WorkoutTemplate> {
    const response = await fetch(
        `${API_URL}/api/workout-templates/${templateId}`,
        {
            method: "PATCH",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(templateData),
        },
    );

    return parseJsonResponse<WorkoutTemplate>(
        response,
        t("workoutTemplateApi.failedToUpdateWorkoutTemplate"),
    );
}

export async function deleteWorkoutTemplateRequest(
    templateId: string,
): Promise<{
    message: string;
    deletedTemplateId: string;
}> {
    const response = await fetch(
        `${API_URL}/api/workout-templates/${templateId}`,
        {
            method: "DELETE",
            credentials: "include",
        },
    );

    return parseJsonResponse<{
        message: string;
        deletedTemplateId: string;
    }>(response, t("common.failedToDeleteWorkoutTemplate"));
}

export async function startWorkoutFromTemplateRequest(
    templateId: string,
): Promise<StartedWorkoutDraft> {
    const response = await fetch(
        `${API_URL}/api/workout-templates/${templateId}/start`,
        {
            method: "POST",
            credentials: "include",
        },
    );

    const draft = await parseJsonResponse<StartedWorkoutDraft>(
        response,
        t("common.failedToStartWorkoutFromTemplate"),
    );
    return activateWorkoutDraftRequest(draft._id);
}

export async function createWorkoutTemplateFromDraftRequest(
    draftId: string,
    templateData: CreateWorkoutTemplateFromDraftInput,
): Promise<WorkoutTemplate> {
    const response = await fetch(
        `${API_URL}/api/workout-templates/from-draft/${draftId}`,
        {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(templateData),
        },
    );

    return parseJsonResponse<WorkoutTemplate>(
        response,
        t("workoutTemplateApi.failedToSaveWorkoutTemplate"),
    );
}

export async function createTemplateEditDraftRequest(
    templateId: string,
): Promise<StartedWorkoutDraft> {
    const response = await fetch(
        `${API_URL}/api/workout-templates/${templateId}/edit-draft`,
        {
            method: "POST",
            credentials: "include",
        },
    );

    return parseJsonResponse<StartedWorkoutDraft>(
        response,
        t("workoutTemplateApi.failedToPrepareTemplateForEditing"),
    );
}
