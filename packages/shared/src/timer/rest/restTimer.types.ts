export type RestTimerState = {
    timeLeft: number;
    isRunning: boolean;
    endTime: number | null;
    duration: number;
};

export type RestTimerAction =
    | { type: "START" }
    | { type: "PAUSE" }
    | { type: "RESET" }
    | { type: "TICK" }
    | { type: "ADJUST_TIME"; amountMs: number };