import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useReducer,
    type ReactNode,
} from "react";
import { createWorkoutTimerInitialState, workoutTimerReducer } from "./workoutTimer.reducer";
import type { WorkoutTimerState } from "./workoutTimer.types";

type WorkoutTimerContextValue = {
    state: WorkoutTimerState;
    start: () => void;
    pause: () => void;
    stop: () => void;
    reset: () => void;
};

type WorkoutTimerProviderProps = {
    children: ReactNode;
};

const WORKOUT_TIMER_STORAGE_KEY = "workout-timer-state";

const WorkoutTimerContext = createContext<WorkoutTimerContextValue | null>(null);

function isInitialWorkoutTimerState(state: WorkoutTimerState): boolean {
    return (
        state.elapsedTime === 0 &&
        state.isRunning === false &&
        state.startTime === null &&
        state.lastTickAt === null
    );
}

function hydrateWorkoutTimerState(): WorkoutTimerState {
    const emptyState = createWorkoutTimerInitialState();

    if (typeof window === "undefined") {
        return emptyState;
    }

    try {
        const raw = sessionStorage.getItem(WORKOUT_TIMER_STORAGE_KEY);

        if (!raw) {
            return emptyState
        }

        const saved = JSON.parse(raw) as WorkoutTimerState;
        const now = Date.now();

        if (saved.isRunning && saved.lastTickAt !== null) {
            const missedDelta = now - saved.lastTickAt;

            return {
                ...saved,
                elapsedTime: saved.elapsedTime + Math.max(0, missedDelta),
                lastTickAt: now,
            };
        }

        return saved;
    } catch {
        return emptyState;
    }

}

export function WorkoutTimerProvider({
    children,
}: WorkoutTimerProviderProps): JSX.Element {
    const [state, dispatch] = useReducer(
        workoutTimerReducer,
        undefined,
        createWorkoutTimerInitialState,
    );

    useEffect(() => {
        if (!state.isRunning) return;

        const intervalId = setInterval(() => {
            dispatch({ type: "TICK" });
        }, 1000);

        return () => {
            clearInterval(intervalId);
        };
    }, [state.isRunning]);

    useEffect(() => {
        if (typeof window === "undefined") return;

        try {
            if (isInitialWorkoutTimerState(state)) {
                sessionStorage.removeItem(WORKOUT_TIMER_STORAGE_KEY);
                return;
            }

            sessionStorage.setItem(
                WORKOUT_TIMER_STORAGE_KEY,
                JSON.stringify(state),
            );
        } catch {
        }
    }, [state]);

    const value = useMemo<WorkoutTimerContextValue>(
        () => ({
            state,
            start: () => dispatch({ type: "START" }),
            pause: () => dispatch({ type: "PAUSE" }),
            stop: () => dispatch({ type: "STOP" }),
            reset: () => dispatch({ type: "RESET" }),
        }),
        [state],
    );

    return (
        <WorkoutTimerContext.Provider value={value}>
            {children}
        </WorkoutTimerContext.Provider>
    );
}

export function useWorkoutTimer(): WorkoutTimerContextValue {
    const context = useContext(WorkoutTimerContext);

    if (!context) {
        throw new Error("useWorkoutTimer must be used inside a WorkoutTimerProvider");
    }

    return context;
}