import { z } from "zod";
import { DIFFICULTY_OPTIONS } from "@workout-app/shared";

const difficultySchema = z.enum(DIFFICULTY_OPTIONS);

const nameSchema = z
    .string()
    .trim()
    .min(1, "Workout name is required");

const durationSchema = z
    .number()
    .min(1, "Duration must be at least 1 minute");

export const createWorkoutSchema = z.strictObject({
    name: nameSchema,
    duration: durationSchema,
    difficulty: difficultySchema.default("beginner"),
});

export const workoutIdParamsSchema = z.strictObject({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid workout id"),
});

export const updateWorkoutSchema = createWorkoutSchema
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
        message: "Send at least one field to update",
    });

export type CreateWorkoutInput = z.infer<typeof createWorkoutSchema>;
export type UpdateWorkoutInput = z.infer<typeof updateWorkoutSchema>;