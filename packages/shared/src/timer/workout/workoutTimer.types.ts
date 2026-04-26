export type WorkoutTimerState = {
    elapsedTime: number;
    isRunning: boolean;
    startTime: number | null;
    lastTickAt: number | null;
};

export type WorkoutTimerAction =
    | { type: "START" }
    | { type: "PAUSE" }
    | { type: "STOP" }
    | { type: "RESET" }
    | { type: "TICK" };