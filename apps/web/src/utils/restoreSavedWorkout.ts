import { clearWorkoutSnapshot, readCurrentWorkoutReference, workoutScope } from "./workoutProgressStorage";

export type WorkoutRestoration =
    | { status: "ready"; draftId: string | null }
    | { status: "unavailable"; draftId: null };

export function isInaccessibleDraftError(error: unknown): boolean {
    return !!error && typeof error === "object" && "status" in error
        && [400, 401, 403, 404, 410].includes(Number(error.status));
}

export async function restoreSavedWorkout(
    userId: string,
    fetchDraft: (draftId: string) => Promise<unknown>,
): Promise<WorkoutRestoration> {
    const draftId = readCurrentWorkoutReference(userId);
    if (!draftId) return { status: "ready", draftId: null };
    const scope = workoutScope(userId, draftId);
    try {
        const response = await fetchDraft(draftId);
        if (!isWorkoutDraftResponse(response)) {
            // An invalid response does not establish that a saved workout is invalid.
            return { status: "unavailable", draftId: null };
        }
        if (response.status !== "active" || response.userId !== userId || response._id !== draftId) {
            clearWorkoutSnapshot(scope);
            return { status: "ready", draftId: null };
        }
        return { status: "ready", draftId };
    } catch (error) {
        if (isInaccessibleDraftError(error)) {
            clearWorkoutSnapshot(scope);
            return { status: "ready", draftId: null };
        }
        // Offline, rate limits and server failures must not erase saved progress.
        return { status: "unavailable", draftId: null };
    }
}

export function isWorkoutDraftResponse(value: unknown): value is {
    _id: string;
    userId: string;
    status: "active" | "building" | "completed" | "abandoned";
} {
    return !!value && typeof value === "object" && "status" in value
        && "userId" in value && "_id" in value
        && typeof value.userId === "string" && typeof value._id === "string"
        && ["active", "building", "completed", "abandoned"].includes(String(value.status));
}
