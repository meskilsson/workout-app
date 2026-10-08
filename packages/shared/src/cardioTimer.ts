import { trainingTotalSeconds, type TrainingConfig, type CardioCompletion } from "./training";
export type CardioTimerState = { status: "ready" | "running" | "paused" | "completed"; elapsedMs: number; startedAt: number | null; manual: boolean };
export function createCardioTimer(): CardioTimerState { return { status: "ready", elapsedMs: 0, startedAt: null, manual: false }; }
export function reconcileCardioTimer(state: CardioTimerState, config: TrainingConfig, now: number): CardioTimerState {
    if (state.status !== "running") return state;
    const total = trainingTotalSeconds(config) * 1000;
    const elapsedMs = Math.min(total, state.elapsedMs + Math.max(0, now - state.startedAt!));
    return elapsedMs >= total ? { status: "completed", elapsedMs: total, startedAt: null, manual: false } : state;
}
export function cardioElapsed(state: CardioTimerState, config: TrainingConfig, now: number): number {
    return Math.min(trainingTotalSeconds(config) * 1000, state.elapsedMs + (state.status === "running" ? Math.max(0, now - state.startedAt!) : 0));
}
export function cardioTimerAction(state: CardioTimerState, config: TrainingConfig, action: "start" | "pause" | "resume" | "reset" | "complete", now: number): CardioTimerState {
    if (action === "reset") return createCardioTimer();
    state = reconcileCardioTimer(state, config, now);
    if (action === "complete" && state.status !== "completed") return { status: "completed", elapsedMs: cardioElapsed(state, config, now), startedAt: null, manual: true };
    if ((action === "start" && state.status === "ready") || (action === "resume" && state.status === "paused")) return { ...state, status: "running", startedAt: now };
    if (action === "pause" && state.status === "running") return { ...state, status: "paused", elapsedMs: cardioElapsed(state, config, now), startedAt: null };
    return state;
}
export function cardioTimerView(state: CardioTimerState, config: TrainingConfig, now: number) {
    const elapsed = cardioElapsed(state, config, now) / 1000;
    const total = trainingTotalSeconds(config);
    let round = 1, completedRounds = 0, phase = "Work", phaseRemaining = Math.max(0, total - elapsed);
    if (config.format === "intervals") {
        const cycle = config.workSeconds + config.restSeconds;
        round = Math.min(config.rounds, Math.floor(elapsed / cycle) + 1);
        const within = elapsed - (round - 1) * cycle;
        completedRounds = Math.min(config.rounds, round - 1 + (within >= config.workSeconds ? 1 : 0));
        phase = within < config.workSeconds ? "Work" : "Rest";
        phaseRemaining = Math.max(0, (phase === "Work" ? config.workSeconds : cycle) - within);
    } else completedRounds = elapsed >= total ? 1 : 0;
    if (state.status === "completed") phaseRemaining = 0;
    return { phase: state.status === "running" ? phase : state.status === "paused" ? `Paused (${phase})` : state.status === "ready" ? "Ready" : "Completed",
        round, completedRounds, phaseRemaining, remaining: Math.max(0, total - elapsed), elapsed };
}
export function cardioCompletion(state: CardioTimerState, config: TrainingConfig): CardioCompletion | undefined {
    if (state.status !== "completed") return undefined;
    const view = cardioTimerView(state, config, 0);
    return { elapsedSeconds: view.elapsed, completedRounds: view.completedRounds, manual: state.manual };
}
export function isCardioTimerState(value: unknown): value is CardioTimerState {
    if (!value || typeof value !== "object") return false;
    const s = value as CardioTimerState;
    return ["ready", "running", "paused", "completed"].includes(s.status) && Number.isFinite(s.elapsedMs) && s.elapsedMs >= 0
        && typeof s.manual === "boolean" && (s.status === "completed" || s.manual === false) && (s.status !== "ready" || s.elapsedMs === 0) && (s.status === "running" ? typeof s.startedAt === "number" && Number.isFinite(s.startedAt) : s.startedAt === null);
}
