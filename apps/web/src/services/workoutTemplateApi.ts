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
        "Failed to fetch public workout templates",
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
        "Failed to fetch public workout template",
    );
}

export async function getMyWorkoutTemplatesRequest(signal?: AbortSignal): Promise<WorkoutTemplate[]> {
    const response = await fetch(`${API_URL}/api/workout-templates/my`, {
        signal,
        credentials: "include",
    });

    return parseJsonResponse<WorkoutTemplate[]>(
        response,
        "Failed to fetch your workout templates",
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
        "Failed to fetch your workout template",
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
        "Failed to create workout template",
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
        "Failed to update workout template",
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
    }>(response, "Failed to delete workout template");
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

    return parseJsonResponse<StartedWorkoutDraft>(
        response,
        "Failed to start workout from template",
    );
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
        "Failed to save workout template",
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
        "Failed to prepare template for editing",
    );
}
