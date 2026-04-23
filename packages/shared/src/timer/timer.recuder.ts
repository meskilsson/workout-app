import type { TimerAction, TimerState } from "./timer.types";
import { secondsToMilliseconds } from "./timer.utils";

export const TIMER_DURATION_MS = secondsToMilliseconds(60);

export const initialTimerState: TimerState = {
    timeLeft: TIMER_DURATION_MS,
    isRunning: false,
    startTime: null,
    endTime: null,
    duration: TIMER_DURATION_MS,
    isFinished: false,
};

export function timerReducer(state: TimerState, action: TimerAction): TimerState {
    switch (action.type) {
        case "START": {
            if (state.isRunning) return state;

            const currentTime = Date.now();
            const remainingAmount = state.timeLeft > 0 ? state.timeLeft : state.duration;

            return {
                ...state,
                startTime: currentTime,
                endTime: currentTime + remainingAmount,
                timeLeft: remainingAmount,
                isRunning: true,
                isFinished: false,
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
                isFinished: false,
            };
        }

        case "RESET": {
            return {
                ...initialTimerState,
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
                    isFinished: true,
                    startTime: null,
                    endTime: null,
                };
            }

            return {
                ...state,
                timeLeft: remainingTime,
                isRunning: true,
                isFinished: false,
            };
        }

        default:
            return state;
    }
}