import { z } from "zod";
import { MUSCLE_OPTIONS } from "@workout-app/shared";

const objectIdSchema = z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

const muscleSchema = z
    .string()
    .trim()
    .toLowerCase()
    .refine((value) => MUSCLE_OPTIONS.includes(value as never), {
        message: "Invalid muscle group",
    });

export const workoutDraftIdParamsSchema = z.strictObject({
    draftId: objectIdSchema,
});

export const createWorkoutDraftSchema = z.strictObject({
    selectedMuscleGroups: z
        .array(muscleSchema)
        .min(1, "At least one muscle group is required"),
});

export const updateWorkoutDraftMuscleGroupsSchema = z.strictObject({
    selectedMuscleGroups: z
        .array(muscleSchema)
        .min(1, "At least one muscle group is required"),
});

export const updateWorkoutDraftExercisesSchema = z.strictObject({
    exerciseIds: z
        .array(objectIdSchema)
        .min(1, "At least one exercise is required"),
});

const draftSetValueSchema = z.union([
    z.string(),
    z.number(),
    z.null(),
]).optional();

const draftSetSchema = z.strictObject({
    weight: draftSetValueSchema,
    reps: draftSetValueSchema,
});

export const updateWorkoutDraftSetsSchema = z.strictObject({
    exerciseId: objectIdSchema,

    sets: z.array(draftSetSchema),
});

export type WorkoutDraftIdParams = z.infer<
    typeof workoutDraftIdParamsSchema
>;

export type CreateWorkoutDraftInput = z.infer<
    typeof createWorkoutDraftSchema
>;

export type UpdateWorkoutDraftMuscleGroupsInput = z.infer<
    typeof updateWorkoutDraftMuscleGroupsSchema
>;

export type UpdateWorkoutDraftExercisesInput = z.infer<
    typeof updateWorkoutDraftExercisesSchema
>;

export type UpdateWorkoutDraftSetsInput = z.infer<
    typeof updateWorkoutDraftSetsSchema
>;