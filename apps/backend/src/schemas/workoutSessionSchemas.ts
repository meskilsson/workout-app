import { z } from "zod";

export const workoutSessionIdParamsSchema = z.strictObject({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid workout session id"),
});

const objectIdSchema = z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid exercise id");

const dateStringSchema = z
    .string()
    .refine((value) => !Number.isNaN(new Date(value).getTime()), {
        message: "Invalid date",
    });

const workoutSetSchema = z.strictObject({
    weight: z.coerce
        .number()
        .min(0, "Weight must be 0 or greater"),

    reps: z.coerce
        .number()
        .int("Reps must be a whole number")
        .min(1, "Reps must be at least 1"),
});

const workoutSessionExerciseSchema = z.strictObject({
    exerciseId: objectIdSchema.nullable().optional(),

    exerciseName: z
        .string()
        .trim()
        .min(1, "Exercise name is required"),

    sets: z
        .array(workoutSetSchema)
        .min(1, "At least one set is required"),
});

export const createWorkoutSessionSchema = z.strictObject({
    exercises: z
        .array(workoutSessionExerciseSchema)
        .min(1, "At least one exercise is required"),

    startedAt: dateStringSchema,

    endedAt: dateStringSchema,
});

export type WorkoutSessionIdParams = z.infer<
    typeof workoutSessionIdParamsSchema
>;

export type CreateWorkoutSessionInput = z.infer<
    typeof createWorkoutSessionSchema
>;