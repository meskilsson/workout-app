import { z } from "zod";
import {
    MUSCLE_OPTIONS,
    EQUIPMENT_OPTIONS,
    DIFFICULTY_OPTIONS,
    EXERCISE_TYPE_OPTIONS,
} from "@workout-app/shared";

export const exerciseIdParamsSchema = z.strictObject({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid exercise id"),
});

const exerciseTypeSchema = z.enum(EXERCISE_TYPE_OPTIONS);

const muscleSchema = z.enum(MUSCLE_OPTIONS);

const equipmentSchema = z.enum(EQUIPMENT_OPTIONS);

const difficultySchema = z.enum(DIFFICULTY_OPTIONS);

const exerciseNameSchema = z
    .string()
    .trim()
    .min(2, "Exercise name has to be at least 2 characters")
    .max(50, "Exercise name cannot be more than 50 characters");

const optionalTextSchema = z.string().trim().optional();

export const createExerciseSchema = z.strictObject({
    name: exerciseNameSchema,
    description: optionalTextSchema,
    instructions: optionalTextSchema,
    exerciseType: exerciseTypeSchema.optional(),
    primaryMuscles: z.array(muscleSchema).optional(),
    secondaryMuscles: z.array(muscleSchema).optional(),
    equipment: equipmentSchema.optional(),
    difficulty: difficultySchema.optional(),
    videoUrl: optionalTextSchema,
    imageUrl: optionalTextSchema,
});

export const updateExerciseSchema = createExerciseSchema
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
        message: "Send at least one field to update",
    });

export type ExerciseIdParams = z.infer<typeof exerciseIdParamsSchema>;
export type CreateExerciseInput = z.infer<typeof createExerciseSchema>;
export type UpdateExerciseInput = z.infer<typeof updateExerciseSchema>;