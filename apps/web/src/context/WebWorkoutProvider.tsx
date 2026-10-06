import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CurrentWorkoutStateProvider, useCurrentWorkout } from "@workout-app/shared/currentWorkoutContext";
import { WorkoutTimerProvider } from "@workout-app/shared/timer";
import { useAuth } from "./AuthContext";
import AppLoadingSkeleton from "../components/Loading/AppLoadingSkeleton";
import Button from "../components/ui/button/Button";
import { getWorkoutDraftByIdRequest } from "../services/workoutDraftApi";
import { restoreSavedWorkout } from "../utils/restoreSavedWorkout";
import { createWebWorkoutTimerStorage, saveCurrentWorkoutReference, workoutScope } from "../utils/workoutProgressStorage";

export default function WebWorkoutProvider({ children }: { children: ReactNode }) {
    const { user, loading } = useAuth();
    if (loading) return <AppLoadingSkeleton message="Checking your session..." />;
    return <UserWorkoutProvider key={user?._id ?? "signed-out"} userId={user?._id ?? null}>{children}</UserWorkoutProvider>;
}

function UserWorkoutProvider({ userId, children }: { userId: string | null; children: ReactNode }) {
    const [currentWorkoutId, setCurrentWorkoutId] = useState<string | null>(null);
    const [phase, setPhase] = useState<"loading" | "ready" | "unavailable">("loading");
    const [attempt, setAttempt] = useState(0);
    useEffect(() => {
        let cancelled = false;
        async function restore() {
            const result = userId ? await restoreSavedWorkout(userId, getWorkoutDraftByIdRequest)
                : { status: "ready" as const, draftId: null };
            if (cancelled) return;
            setCurrentWorkoutId(result.draftId);
            setPhase(result.status);
        }
        void restore();
        return () => { cancelled = true; };
    }, [userId, attempt]);
    useEffect(() => {
        if (userId && phase === "ready") saveCurrentWorkoutReference(userId, currentWorkoutId);
    }, [userId, phase, currentWorkoutId]);
    const value = useMemo(() => ({ currentWorkoutId, setCurrentWorkoutId }), [currentWorkoutId]);
    if (phase === "loading") return <AppLoadingSkeleton message="Checking your saved workout..." />;
    if (phase === "unavailable") return <div role="alert">
        <p>We couldn't verify your saved workout. Your progress is still saved.</p>
        <Button onClick={() => { setPhase("loading"); setAttempt(previous => previous + 1); }}>Retry</Button>
    </div>;
    return <CurrentWorkoutStateProvider value={value}>
        <ScopedWorkoutTimer userId={userId}>{children}</ScopedWorkoutTimer>
    </CurrentWorkoutStateProvider>;
}

function ScopedWorkoutTimer({ userId, children }: { userId: string | null; children: ReactNode }) {
    const { currentWorkoutId } = useCurrentWorkout();
    const scope = userId && currentWorkoutId ? workoutScope(userId, currentWorkoutId) : null;
    const storage = useMemo(() => createWebWorkoutTimerStorage(scope), [scope]);
    return <WorkoutTimerProvider key={scope ?? "inactive"} storage={storage}>{children}</WorkoutTimerProvider>;
}

