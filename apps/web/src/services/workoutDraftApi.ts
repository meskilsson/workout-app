const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

type CreateWorkoutDraftInput = {
    selectedMuscleGroups: string[];
};

type UpdateWorkoutDraftExercisesInput = {
    exerciseIds: string[];
};

type UpdateWorkoutDraftSetsInput = {
    exerciseId: string;
    sets: {
        weight: string | number | null;
        reps: string | number | null;
    }[];
};

async function handleResponse(response: Response, fallbackMessage: string) {
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || fallbackMessage);
    }

    return data;
}

export async function createWorkoutDraftRequest(
    draftData: CreateWorkoutDraftInput,
) {
    const response = await fetch(`${API_URL}/api/workout-drafts`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(draftData),
    });

    return handleResponse(response, "Failed to create workout draft");
}

export async function getCurrentWorkoutDraftRequest() {
    const response = await fetch(`${API_URL}/api/workout-drafts/current`, {
        credentials: "include",
    });

    return handleResponse(response, "Failed to fetch current workout draft");
}

export async function getWorkoutDraftByIdRequest(draftId: string) {
    const response = await fetch(`${API_URL}/api/workout-drafts/${draftId}`, {
        credentials: "include",
    });

    return handleResponse(response, "Failed to fetch workout draft");
}

export async function updateWorkoutDraftExercisesRequest(
    draftId: string,
    exerciseData: UpdateWorkoutDraftExercisesInput,
) {
    const response = await fetch(
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

    return handleResponse(response, "Failed to update workout draft exercises");
}

export async function startWorkoutDraftRequest(draftId: string) {
    const response = await fetch(
        `${API_URL}/api/workout-drafts/${draftId}/start`,
        {
            method: "PATCH",
            credentials: "include",
        },
    );

    return handleResponse(response, "Failed to start workout draft");
}

export async function updateWorkoutDraftSetsRequest(
    draftId: string,
    setData: UpdateWorkoutDraftSetsInput,
) {
    const response = await fetch(
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

    return handleResponse(response, "Failed to update workout draft sets");
}

export async function completeWorkoutDraftRequest(draftId: string) {
    const response = await fetch(
        `${API_URL}/api/workout-drafts/${draftId}/complete`,
        {
            method: "POST",
            credentials: "include",
        },
    );

    return handleResponse(response, "Failed to complete workout draft");
}

export async function abandonWorkoutDraftRequest(draftId: string) {
    const response = await fetch(
        `${API_URL}/api/workout-drafts/${draftId}/abandon`,
        {
            method: "PATCH",
            credentials: "include",
        },
    );

    return handleResponse(response, "Failed to abandon workout draft");
}