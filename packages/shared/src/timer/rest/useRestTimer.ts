import { useCallback, useEffect, useReducer } from "react";
import type { RestTimerState } from "./restTimer.types";
import { createRestTimerInitialState, restTimerReducer } from "./restTimer.reducer";

export type RestTimerStorage = {
    load: (durationMs: number) => RestTimerState;
    save: (state: RestTimerState) => void;
};

export function useRestTimer(durationMs: number, storage?: RestTimerStorage, onComplete?: () => void) {
    const [state, dispatch] = useReducer(
        restTimerReducer,
        durationMs,
        (duration) => storage?.load(duration) ?? createRestTimerInitialState(duration),
    );

    useEffect(() => {
        if (!state.isRunning) return;

        let completed = false;
        const intervalId = setInterval(() => {
            const expired = state.endTime !== null && Date.now() >= state.endTime;
            dispatch({ type: "TICK" });
            if (expired && !completed) {
                completed = true;
                onComplete?.();
            }
        }, 1000);

        return () => {
            clearInterval(intervalId);
        };
    }, [state.isRunning, state.endTime, onComplete]);

    useEffect(() => {
        storage?.save(state);
    }, [state, storage]);

    const start = useCallback(() => dispatch({ type: "START" }), []);
    const pause = useCallback(() => dispatch({ type: "PAUSE" }), []);
    const reset = useCallback(() => dispatch({ type: "RESET" }), []);
    const adjustTime = useCallback((amountMs: number) =>
        dispatch({ type: "ADJUST_TIME", amountMs }), []);
    return { state, start, pause, reset, adjustTime };
}
