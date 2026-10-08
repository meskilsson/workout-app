import { Schema } from "mongoose";
import { validateTraining, type TrainingConfig, type CardioCompletion } from "@workout-app/shared";
export interface TrainingFields { training?: TrainingConfig; cardioCompletion?: CardioCompletion; }
export const trainingField = { type: Schema.Types.Mixed, default: undefined,
    validate: { validator: (value: unknown) => { try { validateTraining(value); return true; } catch { return false; } }, message: "Invalid training configuration" } };
export const cardioCompletionField = { type: new Schema({ elapsedSeconds: { type: Number, min: 0, max: 86400, required: true }, completedRounds: { type: Number, min: 0, max: 100, required: true }, manual: { type: Boolean, required: true } }, { _id: false }), default: undefined };
