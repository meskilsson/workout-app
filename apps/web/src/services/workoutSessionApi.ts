const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

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
    const response = await fetch(`${API_URL}/api/workout-sessions`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(sessionData),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Failed to save workout session");
    }

    return data;
}

export async function getMyWorkoutSessionsRequest() {
    const response = await fetch(`${API_URL}/api/workout-sessions/me`, {
        credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Failed to fetch workout history");
    }

    return data;
}

export async function getWorkoutSessionByIdRequest(sessionId: string) {
    const response = await fetch(`${API_URL}/api/workout-sessions/${sessionId}`, {
        credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Failed to fetch workout session");
    }

    return data;
}