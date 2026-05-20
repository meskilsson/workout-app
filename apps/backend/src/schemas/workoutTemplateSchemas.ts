import { z } from 'zod';

const objectIdSchema = z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

const plannedSetSchema = z.object({
    reps: z.number().min(0).nullable().optional(),
    weight: z.number().min(0).nullable().optional(),
    restSeconds: z.number().min(0).nullable().optional(),
    notes: z.string().trim().max(200).optional(),
});

const templateExerciseSchema = z.object({
    exerciseId: objectIdSchema,
    plannedSets: z.array(plannedSetSchema).optional(),
});

export const createWorkoutTemplateSchema = z.object({
    name: z.string().trim().min(2).max(80),

    description: z.string().trim().max(500).optional(),

    category: z
        .enum([
            "full_body",
            "push",
            "pull",
            "legs",
            "upper",
            "lower",
            "custom",
        ])
        .optional(),

    exercises: z.array(templateExerciseSchema).min(1),
});

export const updateWorkoutTemplateSchema = z.object({
    name: z.string().trim().min(2).max(80).optional(),

    description: z.string().trim().max(500).optional(),

    category: z
        .enum([
            "full_body",
            "push",
            "pull",
            "legs",
            "upper",
            "lower",
            "custom",
        ])
        .optional(),

    exercises: z.array(templateExerciseSchema).min(1).optional(),
});


export const workoutTemplateIdParamSchema = z.object({
    templateId: objectIdSchema,
});

export type CreateWorkoutTemplateInput = z.infer<
    typeof createWorkoutTemplateSchema
>;

export type UpdateWorkoutTemplateInput = z.infer<
    typeof updateWorkoutTemplateSchema
>;

export type WorkoutTemplateIdParams = z.infer<
    typeof workoutTemplateIdParamSchema
>;