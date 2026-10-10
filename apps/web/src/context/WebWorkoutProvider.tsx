import { useQuery, useQueryClient } from "@tanstack/react-query";
import { draftKeys } from "../query/queryClient";
import { draftDetailOptions } from "../query/resourceQueries";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CurrentWorkoutStateProvider, useCurrentWorkout } from "@workout-app/shared/currentWorkoutContext";
import { WorkoutTimerProvider } from "@workout-app/shared/timer";
import { useAuth } from "./AuthContext";
import AppLoadingSkeleton from "../components/Loading/AppLoadingSkeleton";
import { RotateCcw } from "lucide-react";
import styles from "./WebWorkoutProvider.module.css";
import Button from "../components/ui/button/Button";
import { restoreSavedWorkout } from "../utils/restoreSavedWorkout";
import { createWebWorkoutTimerStorage, saveCurrentWorkoutReference, workoutScope } from "../utils/workoutProgressStorage";

export default function WebWorkoutProvider({ children }: { children: ReactNode }) {
    const { user, loading } = useAuth();
    if (loading) return <AppLoadingSkeleton message="Checking your session..." />;
    return <UserWorkoutProvider key={user?._id ?? "signed-out"} userId={user?._id ?? null}>{children}</UserWorkoutProvider>;
}

function UserWorkoutProvider({ userId, children }: { userId: string | null; children: ReactNode }) {
    const client = useQueryClient();
    const restoration = useQuery({
        queryKey: draftKeys.restoration(userId ?? "signed-out"),
        queryFn: () => userId ? restoreSavedWorkout(userId, id => client.fetchQuery(draftDetailOptions(userId, id)))
            : Promise.resolve({ status: "ready" as const, draftId: null }),
        gcTime: 0, staleTime: Infinity, refetchOnMount: "always", refetchOnReconnect: false,
    });
    if (restoration.isPending || restoration.isFetching) return <AppLoadingSkeleton message="Checking your saved workout..." />;
    if (restoration.isError || restoration.data.status === "unavailable") return <main className={styles.recovery}><section className={styles.recoveryCard} role="alert">
        <h1>Unable to restore your workout</h1>
        <p>We couldn't verify your saved workout. Your progress is still saved.</p>
        <Button icon={RotateCcw} onClick={() => void restoration.refetch()}>Retry</Button>
    </section></main>;
    return <ReadyWorkoutProvider userId={userId} initialDraftId={restoration.data.draftId}>{children}</ReadyWorkoutProvider>;
}

function ReadyWorkoutProvider({ userId, initialDraftId, children }: { userId: string | null; initialDraftId: string | null; children: ReactNode }) {
    const [currentWorkoutId, setCurrentWorkoutId] = useState(initialDraftId);
    useEffect(() => {
        if (userId) saveCurrentWorkoutReference(userId, currentWorkoutId);
    }, [userId, currentWorkoutId]);
    const value = useMemo(() => ({ currentWorkoutId, setCurrentWorkoutId }), [currentWorkoutId]);
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

