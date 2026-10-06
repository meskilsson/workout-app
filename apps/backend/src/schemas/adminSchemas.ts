import { z } from "zod";
import { createExerciseSchema } from "./exerciseSchemas";
import { createWorkoutTemplateSchema } from "./workoutTemplateSchemas";
import { createWorkoutSessionSchema } from "./workoutSessionSchemas";

export const adminListSchema = z.strictObject({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  search: z.string().trim().max(100).default(""),
  scope: z.enum(["all", "shared", "personal"]).default("all"),
});
export const adminUserSchema = z.strictObject({ role: z.enum(["user", "admin"]).optional(), active: z.boolean().optional() })
  .refine(value => Object.keys(value).length > 0, "Choose a role or account status");
export const adminExerciseSchema = createExerciseSchema;
export const adminTemplateSchema = createWorkoutTemplateSchema.strict();
export const adminSessionSchema = createWorkoutSessionSchema.extend({
  userId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid owner id"),
}).refine(value => new Date(value.endedAt) >= new Date(value.startedAt), { path: ["endedAt"], message: "End time must be after start time" });
