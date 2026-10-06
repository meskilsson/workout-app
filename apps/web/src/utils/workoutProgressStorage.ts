import { createWorkoutTimerInitialState, isFreshWorkoutTimer, type WorkoutTimerState, type WorkoutTimerStorage } from "@workout-app/shared/timer";
import { createRestTimerInitialState, type RestTimerState, type RestTimerStorage } from "@workout-app/shared/timer/rest";

export type PersistedWorkoutSet = {
    id: string;
    weight: string;
    reps: string;
    isCompleted: boolean;
};
export type SetsByExercise = Record<string, PersistedWorkoutSet[]>;

export const WORKOUT_SNAPSHOT_CLEARED = "workout-snapshot-cleared";

const PREFIX = "workout-progress:";
const clearedScopes = new Set<string>();
export function workoutScope(userId: string, draftId: string): string {
    return `${PREFIX}${encodeURIComponent(userId)}:${encodeURIComponent(draftId)}`;
}

function read(scope: string, kind: string): unknown {
    try {
        const raw = localStorage.getItem(`${scope}:${kind}`);
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}
function write(scope: string, kind: string, value: unknown): void {
    if (clearedScopes.has(scope) || read(scope, "cleared") === true) return;
    try { localStorage.setItem(`${scope}:${kind}`, JSON.stringify(value)); } catch { /* Storage may be unavailable. */ }
}

export function restoreWorkoutSets(scope: string, current: SetsByExercise): SetsByExercise {
    if (read(scope, "cleared") === true) return current;
    const saved = read(scope, "sets");
    if (!saved || typeof saved !== "object") return current;
    const result: SetsByExercise = {};
    for (const [exerciseId, sets] of Object.entries(current)) {
        const entries = (saved as Record<string, unknown>)[exerciseId];
        const byId = new Map<string, PersistedWorkoutSet>();
        if (Array.isArray(entries)) {
            for (const entry of entries) {
                if (entry && typeof entry.id === "string" && typeof entry.weight === "string"
                    && typeof entry.reps === "string" && typeof entry.isCompleted === "boolean") {
                    byId.set(entry.id, entry);
                }
            }
        }
        // The draft determines membership and order; removed sets cannot return.
        result[exerciseId] = sets.map(set => byId.get(set.id) ?? set);
    }
    return result;
}
export function saveWorkoutSets(scope: string, sets: SetsByExercise): void {
    write(scope, "sets", sets);
}

export function createWebRestTimerStorage(scope: string): RestTimerStorage {
    return {
        load(duration) {
            const empty = createRestTimerInitialState(duration);
            if (read(scope, "cleared") === true) return empty;
            const saved = read(scope, "rest") as Partial<RestTimerState> | null;
            if (!saved || !Number.isFinite(saved.duration) || (saved.duration ?? 0) <= 0
                || !Number.isFinite(saved.timeLeft) || (saved.timeLeft ?? -1) < 0
                || typeof saved.isRunning !== "boolean"
                || (saved.endTime !== null && !Number.isFinite(saved.endTime))) return empty;
            if (saved.isRunning) {
                if (typeof saved.endTime !== "number") return empty;
                const timeLeft = Math.max(0, saved.endTime - Date.now());
                return { duration: saved.duration!, timeLeft, isRunning: timeLeft > 0,
                    endTime: timeLeft > 0 ? saved.endTime : null };
            }
            return { duration: saved.duration!, timeLeft: saved.timeLeft!, isRunning: false, endTime: null };
        },
        save(state) {
            if (!state.isRunning && state.endTime === null && state.timeLeft === state.duration) {
                try { localStorage.removeItem(`${scope}:rest`); } catch { /* Storage may be unavailable. */ }
            } else write(scope, "rest", state);
        },
    };
}

export function clearWorkoutSnapshot(scope: string): void {
    clearedScopes.add(scope);
    try {
        const [, userId, draftId] = scope.split(":");
        if (userId && draftId && readCurrentWorkoutReference(decodeURIComponent(userId)) === decodeURIComponent(draftId)) {
            saveCurrentWorkoutReference(decodeURIComponent(userId), null);
        }
    } catch { /* A malformed key must not prevent cleanup of other snapshots. */ }
    try {
        localStorage.removeItem(`${scope}:sets`);
        localStorage.removeItem(`${scope}:rest`);
        localStorage.removeItem(`${scope}:duration`);
        localStorage.setItem(`${scope}:cleared`, "true");
    } catch { /* Storage may be unavailable. */ }
    if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(WORKOUT_SNAPSHOT_CLEARED, { detail: scope }));
    }
}
export function clearDraftSnapshots(draftId: string): void {
    try {
        const suffix = `:${encodeURIComponent(draftId)}`;
        const scopes = new Set<string>();
        const keys = Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index));
        for (const key of keys) {
            if (key?.startsWith("workout-current:")) {
                try {
                    const userId = decodeURIComponent(key.slice("workout-current:".length));
                    if (readCurrentWorkoutReference(userId) === draftId) scopes.add(workoutScope(userId, draftId));
                } catch { /* Ignore malformed reference keys. */ }
            }
            if (!key?.startsWith(PREFIX)) continue;
            const scope = key.replace(/:(sets|rest|duration|cleared)$/, "");
            if (scope.endsWith(suffix)) scopes.add(scope);
        }
        for (const scope of scopes) clearWorkoutSnapshot(scope);
    } catch { /* Storage may be unavailable. */ }
}
export function clearUserSnapshots(userId: string): void {
    try {
        const prefix = `${PREFIX}${encodeURIComponent(userId)}:`;
        const keys: string[] = [];
        for (let index = 0; index < localStorage.length; index++) {
            const key = localStorage.key(index);
            if (key?.startsWith(prefix) && !key.endsWith(":cleared")) keys.push(key);
        }
        localStorage.removeItem(currentWorkoutReferenceKey(userId));
        // Logout clears data, but a later login may start saving again.
        for (const key of keys) localStorage.removeItem(key);
    } catch { /* Storage may be unavailable. */ }
}

export function createWebWorkoutTimerStorage(scope: string | null): WorkoutTimerStorage {
    return {
        load() {
            const empty = createWorkoutTimerInitialState();
            if (!scope || read(scope, "cleared") === true) return empty;
            const saved = read(scope, "duration") as Partial<WorkoutTimerState> | null;
            if (!saved || typeof saved.elapsedTime !== "number" || !Number.isFinite(saved.elapsedTime)
                || saved.elapsedTime < 0 || typeof saved.isRunning !== "boolean"
                || !(saved.startTime === null || (typeof saved.startTime === "number" && Number.isFinite(saved.startTime)))
                || !(saved.lastTickAt === null || (typeof saved.lastTickAt === "number" && Number.isFinite(saved.lastTickAt)))
                || (saved.isRunning && (saved.startTime === null || saved.lastTickAt === null))) return empty;
            const state = saved as WorkoutTimerState;
            const now = Date.now();
            return state.isRunning ? { ...state,
                elapsedTime: state.elapsedTime + Math.max(0, now - state.lastTickAt!), lastTickAt: now }
                : { ...state, lastTickAt: null };
        },
        save(state) {
            if (!scope) return;
            if (isFreshWorkoutTimer(state)) {
                try { localStorage.removeItem(`${scope}:duration`); } catch { /* Storage may be unavailable. */ }
            } else write(scope, "duration", state);
        },
    };
}

export function currentWorkoutReferenceKey(userId: string): string {
    return `workout-current:${encodeURIComponent(userId)}`;
}
export function readCurrentWorkoutReference(userId: string): string | null {
    try {
        const key = currentWorkoutReferenceKey(userId);
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        const id: unknown = JSON.parse(raw);
        if (typeof id === "string" && /^[0-9a-f]{24}$/i.test(id)) return id;
        localStorage.removeItem(key);
    } catch {
        try { localStorage.removeItem(currentWorkoutReferenceKey(userId)); } catch { /* Storage may be unavailable. */ }
    }
    return null;
}
export function saveCurrentWorkoutReference(userId: string, draftId: string | null): void {
    try {
        const key = currentWorkoutReferenceKey(userId);
        if (draftId && read(workoutScope(userId, draftId), "cleared") !== true)
            localStorage.setItem(key, JSON.stringify(draftId));
        else localStorage.removeItem(key);
    } catch { /* Storage may be unavailable. */ }
}
