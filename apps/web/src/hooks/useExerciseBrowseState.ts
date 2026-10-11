import { useCallback, useEffect, useState } from "react";
import { exerciseBrowseKey, readExerciseBrowseState, type ExerciseBrowseState } from "../utils/exerciseBrowseStorage";

function restore(key: string) {
    try { return readExerciseBrowseState(key, window.sessionStorage); }
    catch { return readExerciseBrowseState(key); }
}
export function useExerciseBrowseState(userId?: string, draftId?: string) {
    const key = exerciseBrowseKey(userId, draftId);
    const [stored, setStored] = useState(() => ({ key, value: restore(key) }));
    const value = stored.key === key ? stored.value : restore(key);
    // Reset the local copy immediately when the account or draft changes.
    if (stored.key !== key) setStored({ key, value });
    useEffect(() => {
        if (stored.key !== key) return;
        try { window.sessionStorage.setItem(key, JSON.stringify(stored.value)); } catch { /* Storage is optional. */ }
    }, [key, stored]);
    const update = useCallback(<K extends keyof ExerciseBrowseState>(field: K, next: ExerciseBrowseState[K]) => {
        setStored(previous => ({ key, value: { ...(previous.key === key ? previous.value : restore(key)), [field]: next } }));
    }, [key]);
    return { ...value, update };
}
