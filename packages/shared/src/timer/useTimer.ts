import { useEffect, useReducer } from "react";
import { initialTimerState, timerReducer } from "./timer.reducer";

export function useTimer() {
    const [state, dispatch] = useReducer(timerReducer, initialTimerState);

    useEffect(() => {
        if (!state.isRunning) return;

        const intervalId = setInterval(() => {
            dispatch({ type: "TICK" });
        }, 1000);

        return () => {
            clearInterval(intervalId);
        };
    }, [state.isRunning]);

    function start() {
        dispatch({ type: "START" });
    }

    function pause() {
        dispatch({ type: "PAUSE" });
    }

    function reset() {
        dispatch({ type: "RESET" });
    }

    return {
        state,
        start,
        pause,
        reset,
    };
}