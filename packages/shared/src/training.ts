// Limits: 1–100 rounds, phase durations up to 6 hours, session up to 24 hours.
export type TrainingConfig =
    | { format: "strength" }
    | { format: "cardio"; durationSeconds: number; targetDistance?: number; distanceUnit?: "km" | "mi" | "m" }
    | { format: "intervals"; rounds: number; workSeconds: number; restSeconds: number };
export type CardioCompletion = { elapsedSeconds: number; completedRounds: number; manual: boolean };
export const MAX_PHASE_SECONDS = 21600;
export const MAX_SESSION_SECONDS = 86400;
export function trainingTotalSeconds(config: TrainingConfig): number {
    if (config.format === "strength") return 0;
    return config.format === "cardio" ? config.durationSeconds
        : config.rounds * config.workSeconds + (config.rounds - 1) * config.restSeconds;
}
export function validateTraining(value: unknown): TrainingConfig {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Training configuration is required");
    const v = value as Record<string, unknown>;
    function integer(key: string, min: number, max: number): number {
        const n = v[key];
        if (typeof n !== "number" || !Number.isFinite(n) || !Number.isInteger(n) || n < min || n > max)
            throw new Error(`${key} must be a whole number between ${min} and ${max}`);
        return n;
    }
    let config: TrainingConfig;
    let keys: string[];
    if (v.format === "strength") { config = { format: "strength" }; keys = ["format"]; }
    else if (v.format === "cardio") {
        config = { format: "cardio", durationSeconds: integer("durationSeconds", 1, MAX_PHASE_SECONDS) };
        keys = ["format", "durationSeconds", "targetDistance", "distanceUnit"];
        if (v.targetDistance !== undefined) {
            if (typeof v.targetDistance !== "number" || !Number.isFinite(v.targetDistance) || v.targetDistance <= 0 || v.targetDistance > 1000000)
                throw new Error("Target distance must be positive and at most 1,000,000 units");
            if (!["km", "mi", "m"].includes(String(v.distanceUnit))) throw new Error("Distance unit is required");
            config.targetDistance = v.targetDistance;
            config.distanceUnit = v.distanceUnit as "km" | "mi" | "m";
        } else if (v.distanceUnit !== undefined) throw new Error("Provide a target distance with its unit");
    } else if (v.format === "intervals") {
        config = { format: "intervals", rounds: integer("rounds", 1, 100),
            workSeconds: integer("workSeconds", 1, MAX_PHASE_SECONDS), restSeconds: integer("restSeconds", 0, MAX_PHASE_SECONDS) };
        keys = ["format", "rounds", "workSeconds", "restSeconds"];
    } else throw new Error("Invalid training format");
    if (Object.keys(v).some(key => !keys.includes(key))) throw new Error("Incompatible training fields");
    if (trainingTotalSeconds(config) > MAX_SESSION_SECONDS) throw new Error("A cardio session cannot exceed 24 hours");
    return config;
}
export function validateCardioCompletion(value: unknown, config: TrainingConfig): CardioCompletion {
    if (config.format === "strength" || !value || typeof value !== "object") throw new Error("Invalid cardio completion");
    const v = value as CardioCompletion;
    const rounds = config.format === "intervals" ? config.rounds : 1;
    if (!Number.isFinite(v.elapsedSeconds) || v.elapsedSeconds < 0 || v.elapsedSeconds > trainingTotalSeconds(config)
        || !Number.isInteger(v.completedRounds) || v.completedRounds < 0 || v.completedRounds > rounds || typeof v.manual !== "boolean"
        || Object.keys(v).some(key => !["elapsedSeconds", "completedRounds", "manual"].includes(key))) throw new Error("Invalid cardio completion");
    const expectedRounds = config.format === "intervals" ? Math.min(config.rounds, Math.floor((v.elapsedSeconds + config.restSeconds) / (config.workSeconds + config.restSeconds))) : (v.elapsedSeconds >= config.durationSeconds ? 1 : 0);
    if (v.completedRounds !== expectedRounds) throw new Error("Completed rounds must match actual elapsed time");
    if (!v.manual && (v.elapsedSeconds !== trainingTotalSeconds(config) || v.completedRounds !== rounds)) throw new Error("Automatic completion requires the whole session");
    return { elapsedSeconds: v.elapsedSeconds, completedRounds: v.completedRounds, manual: v.manual };
}
export function formatTrainingSeconds(seconds: number): string {
    const n = Math.ceil(seconds);
    return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")}`;
}
