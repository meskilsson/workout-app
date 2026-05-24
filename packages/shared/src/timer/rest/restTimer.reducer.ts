import type { RestTimerAction, RestTimerState } from "./restTimer.types";

export function createRestTimerInitialState(durationMs: number): RestTimerState {
    return {
        timeLeft: durationMs,
        isRunning: false,
        endTime: null,
        duration: durationMs,
    };
}

export function restTimerReducer(
    state: RestTimerState,
    action: RestTimerAction,
): RestTimerState {
    switch (action.type) {
        case "START": {
            if (state.isRunning) return state;

            const currentTime = Date.now();
            const remainingAmount =
                state.timeLeft > 0 ? state.timeLeft : state.duration;

            return {
                ...state,
                endTime: currentTime + remainingAmount,
                timeLeft: remainingAmount,
                isRunning: true,
            };
        }

        case "PAUSE": {
            const currentTime = Date.now();
            const remainingTime =
                state.endTime === null
                    ? state.timeLeft
                    : Math.max(0, state.endTime - currentTime);

            return {
                ...state,
                timeLeft: remainingTime,
                isRunning: false,
                endTime: null,
            };
        }

        case "RESET": {
            return createRestTimerInitialState(state.duration);
        }

        case "ADJUST_TIME": {
            const currentTime = Date.now();

            const currentTimeLeft =
                state.isRunning && state.endTime !== null
                    ? Math.max(0, state.endTime - currentTime)
                    : state.timeLeft;

            const adjustedTimeLeft = Math.max(
                0,
                currentTimeLeft + action.amountMs,
            );

            return {
                ...state,
                timeLeft: adjustedTimeLeft,
                isRunning: adjustedTimeLeft > 0 ? state.isRunning : false,
                endTime:
                    state.isRunning && adjustedTimeLeft > 0
                        ? currentTime + adjustedTimeLeft
                        : null,
            };
        }

        case "TICK": {
            if (state.endTime === null) return state;

            const currentTime = Date.now();
            const remainingTime = Math.max(0, state.endTime - currentTime);

            if (remainingTime === 0) {
                return {
                    ...state,
                    timeLeft: 0,
                    isRunning: false,
                    endTime: null,
                };
            }

            return {
                ...state,
                timeLeft: remainingTime,
                isRunning: true,
            };
        }

        default:
            return state;
    }
}