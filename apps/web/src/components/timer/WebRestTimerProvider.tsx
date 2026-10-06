import { useEffect, useMemo, type ReactNode } from "react";
import { RestTimerProvider } from "@workout-app/shared/timer/rest";
import { useCurrentWorkout } from "@workout-app/shared/currentWorkoutContext";
import { useAuth } from "../../context/AuthContext";
import { playRestCompleteAlert, prepareRestAlertAudio } from "../../utils/restTimerAlerts";
import { createWebRestTimerStorage, WORKOUT_SNAPSHOT_CLEARED, workoutScope } from "../../utils/workoutProgressStorage";

export default function WebRestTimerProvider({ children }: { children: ReactNode }) {
    useEffect(() => {
        document.addEventListener("pointerdown", prepareRestAlertAudio, true);
        document.addEventListener("keydown", prepareRestAlertAudio, true);
        return () => {
            document.removeEventListener("pointerdown", prepareRestAlertAudio, true);
            document.removeEventListener("keydown", prepareRestAlertAudio, true);
        };
    }, []);
    const { user } = useAuth();
    const { currentWorkoutId, setCurrentWorkoutId } = useCurrentWorkout();
    const scope = user && currentWorkoutId ? workoutScope(user._id, currentWorkoutId) : null;
    const storage = useMemo(() => scope ? createWebRestTimerStorage(scope) : undefined, [scope]);
    useEffect(() => {
        const onCleared = (event: Event) => {
            if (scope && (event as CustomEvent<string>).detail === scope) setCurrentWorkoutId(null);
        };
        const onStorage = (event: StorageEvent) => {
            if (scope && event.key === `${scope}:cleared` && event.newValue === "true") setCurrentWorkoutId(null);
        };
        window.addEventListener(WORKOUT_SNAPSHOT_CLEARED, onCleared);
        window.addEventListener("storage", onStorage);
        return () => {
            window.removeEventListener(WORKOUT_SNAPSHOT_CLEARED, onCleared);
            window.removeEventListener("storage", onStorage);
        };
    }, [scope, setCurrentWorkoutId]);
    // A changed owner/draft must initialize a separate timer before any writes.
    return <RestTimerProvider key={scope ?? "inactive"} storage={storage} onComplete={playRestCompleteAlert}>{children}</RestTimerProvider>;
}
