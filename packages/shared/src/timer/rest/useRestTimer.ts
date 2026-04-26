import { useEffect, useReducer } from "react";
import { createRestTimerInitialState, restTimerReducer } from "./restTimer.reducer";

export function useRestTimer(durationMs: number) {
    const [state, dispatch] = useReducer(
        restTimerReducer,
        durationMs,
        createRestTimerInitialState,
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

    return {
        state,
        start: () => dispatch({ type: "START" }),
        pause: () => dispatch({ type: "PAUSE" }),
        reset: () => dispatch({ type: "RESET" }),
    };
}