import type { WorkoutTimerState } from "./workoutTimer.types";

export function isFreshWorkoutTimer(state: WorkoutTimerState): boolean {
    return state.startTime === null && state.elapsedTime === 0
        && !state.isRunning && state.lastTickAt === null;
}

export function formatElapsedMilliseconds(milliseconds: number): string {
    if (!Number.isFinite(milliseconds)) {
        return "00:00";
    }

    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}