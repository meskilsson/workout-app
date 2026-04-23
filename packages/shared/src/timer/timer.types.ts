export type TimerState = {
    timeLeft: number;
    isRunning: boolean;
    startTime: number | null;
    endTime: number | null;
    duration: number;
    isFinished: boolean;
};

export type TimerAction =
    | { type: "START" }
    | { type: "PAUSE" }
    | { type: "RESET" }
    | { type: "TICK" };