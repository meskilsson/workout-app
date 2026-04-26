import type { WorkoutTimerAction, WorkoutTimerState } from "./workoutTimer.types";

export function createWorkoutTimerInitialState(): WorkoutTimerState {
    return {
        elapsedTime: 0,
        isRunning: false,
        startTime: null,
        lastTickAt: null,
    };
}

export function workoutTimerReducer(
    state: WorkoutTimerState,
    action: WorkoutTimerAction,
): WorkoutTimerState {
    switch (action.type) {
        case "START": {
            if (state.isRunning) return state;

            const currentTime = Date.now();

            return {
                ...state,
                startTime: state.startTime ?? currentTime,
                lastTickAt: currentTime,
                isRunning: true,
            };
        }

        case "PAUSE":
        case "STOP": {
            if (!state.isRunning) {
                return {
                    ...state,
                    isRunning: false,
                    lastTickAt: null,
                };
            }

            const currentTime = Date.now();
            const elapsedDelta =
                state.lastTickAt === null ? 0 : currentTime - state.lastTickAt;

            return {
                ...state,
                elapsedTime: state.elapsedTime + elapsedDelta,
                isRunning: false,
                lastTickAt: null,
            };
        }

        case "RESET": {
            return createWorkoutTimerInitialState();
        }

        case "TICK": {
            if (!state.isRunning || state.lastTickAt === null) return state;

            const currentTime = Date.now();
            const elapsedDelta = currentTime - state.lastTickAt;

            return {
                ...state,
                elapsedTime: state.elapsedTime + elapsedDelta,
                lastTickAt: currentTime,
            };
        }

        default:
            return state;
    }
}