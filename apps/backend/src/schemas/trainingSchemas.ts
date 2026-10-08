import { z } from "zod";
import { validateTraining, type TrainingConfig } from "@workout-app/shared";
export const trainingSchema = z.unknown().transform((value, ctx): TrainingConfig => {
    try { return validateTraining(value); }
    catch (error) { ctx.addIssue({ code: "custom", message: error instanceof Error ? error.message : "Invalid training" }); return z.NEVER; }
});
export const cardioCompletionSchema = z.strictObject({ elapsedSeconds: z.number().min(0).max(86400), completedRounds: z.number().int().min(0).max(100), manual: z.boolean() });
