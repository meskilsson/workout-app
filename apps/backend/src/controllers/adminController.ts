import type { RequestHandler } from "express";
import type { z } from "zod";
import type { Model, Types } from "mongoose";
import User from "../models/User";
import Exercise from "../models/Exercises";
import WorkoutTemplate from "../models/WorkoutTemplate";
import WorkoutSession from "../models/WorkoutSession";
import WorkoutDraft from "../models/WorkoutDraft";
import { manageUser } from "../services/adminUserService";
import { escapeRegex } from "../utils/escapeRegex";
import { ConflictError, NotFoundError, ValidationError } from "../errors/AppError";
import { adminListSchema, adminTemplateSchema, adminSessionSchema, adminUserSchema } from "../schemas/adminSchemas";

type Resource = "exercises" | "templates" | "sessions";
const userFields = "name username email role deletedAt createdAt updatedAt";
type ManagedResource = { createdBy?: Types.ObjectId | null; userId?: Types.ObjectId; deletedAt?: Date | null };
const models = { exercises: Exercise, templates: WorkoutTemplate, sessions: WorkoutSession } as unknown as Record<Resource, Model<ManagedResource>>;
export const overview: RequestHandler = async (_req, res) => {
  const [users, admins, workouts, exercises, sharedExercises, templates, sharedTemplates, drafts] = await Promise.all([
    User.countDocuments({ deletedAt: null }), User.countDocuments({ deletedAt: null, role: "admin" }),
    WorkoutSession.countDocuments({ deletedAt: null }), Exercise.countDocuments({ deletedAt: null }),
    Exercise.countDocuments({ deletedAt: null, isCustom: false, createdBy: null }), WorkoutTemplate.countDocuments(),
    WorkoutTemplate.countDocuments({ isPublic: true, createdBy: null }), WorkoutDraft.countDocuments({ status: { $in: ["building", "active"] } }),
  ]);
  res.json({ users, admins, workouts, exercises, sharedExercises, templates, sharedTemplates, drafts });
};
export const listUsers: RequestHandler = async (req, res) => {
  const { page, limit, search } = req.validatedQuery as z.infer<typeof adminListSchema>;
  const pattern = new RegExp(escapeRegex(search), "i");
  const filter = search ? { $or: [{ name: pattern }, { username: pattern }, { email: pattern }] } : {};
  const [items, total] = await Promise.all([User.find(filter).select(userFields).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(), User.countDocuments(filter)]);
  res.json({ items, total, page, limit });
};
export const userDetails: RequestHandler = async (req, res) => {
  const user = await User.findById(req.params.id).select(userFields).lean();
  if (!user) throw new NotFoundError("User not found");
  const [workouts, exercises, templates] = await Promise.all([
    WorkoutSession.countDocuments({ userId: user._id, deletedAt: null }),
    Exercise.countDocuments({ createdBy: user._id, deletedAt: null }), WorkoutTemplate.countDocuments({ createdBy: user._id }),
  ]);
  res.json({ ...user, totals: { workouts, exercises, templates } });
};
export const updateUser: RequestHandler = async (req, res) => {
  res.json(await manageUser(String(req.params.id), req.user!.id, req.validatedBody as z.infer<typeof adminUserSchema>));
};
export function listResource(resource: Resource): RequestHandler {
  return async (req, res) => {
    const { page, limit, search, scope } = req.validatedQuery as z.infer<typeof adminListSchema>;
    const filter: Record<string, unknown> = resource === "templates" ? {} : { deletedAt: null };
    if (search) filter[resource === "sessions" ? "exercises.exerciseName" : "name"] = new RegExp(escapeRegex(search), "i");
    if (resource !== "sessions" && scope !== "all") {
      filter[resource === "exercises" ? "isCustom" : "isPublic"] = resource === "exercises" ? scope === "personal" : scope === "shared";
    }
    // Personal workout sets and notes are fetched only on explicit detail access.
    const projection = resource === "sessions" ? "userId startedAt endedAt createdAt" : resource === "exercises" ? "name isCustom createdBy equipment difficulty" : "name description category isPublic createdBy";
    const model = models[resource];
    const [items, total] = await Promise.all([model.find(filter).select(projection).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(), model.countDocuments(filter)]);
    res.json({ items, total, page, limit });
  };
}
export function resourceDetails(resource: Resource): RequestHandler {
  return async (req, res) => {
    const item = await models[resource].findById(req.params.id).lean();
    if (!item || ("deletedAt" in item && item.deletedAt)) throw new NotFoundError("Resource not found");
    res.json(item);
  };
}
export function saveResource(resource: Resource, editing: boolean): RequestHandler {
  return async (req, res) => {
    const existing = editing ? await models[resource].findById(req.params.id) : null;
    if (editing && (!existing || ("deletedAt" in existing && existing.deletedAt))) throw new NotFoundError("Resource not found");
    let data: Record<string, unknown> = { ...(req.validatedBody as Record<string, unknown>) };
    if (resource === "templates") {
      const input = req.validatedBody as z.infer<typeof adminTemplateSchema>;
      const owner = existing && "createdBy" in existing ? existing.createdBy : null;
      const ids = input.exercises.map(item => item.exerciseId);
      if (new Set(ids).size !== ids.length) throw new ValidationError("A template cannot contain duplicate exercises", [{ field: "exercises", message: "Remove duplicate exercises" }]);
      const available = await Exercise.find({ _id: { $in: ids }, deletedAt: null, $or: [{ isCustom: false, createdBy: null }, ...(owner ? [{ createdBy: owner }] : [])] });
      if (available.length !== ids.length) throw new ValidationError("Exercises must be shared or belong to the template owner", [{ field: "exercises", message: "One or more exercises are unavailable" }]);
      data.exercises = input.exercises.map((item, order) => ({ exercise: item.exerciseId, exerciseName: available.find(exercise => exercise.id === item.exerciseId)!.name, order, plannedSets: item.plannedSets ?? [], training: item.training }));
      if (!editing) data = { ...data, isPublic: true, createdBy: null };
    } else if (resource === "exercises") {
      if (!editing) data = { ...data, isCustom: false, createdBy: null };
      else data = { ...data, equipment: data.equipment, difficulty: data.difficulty, exerciseType: data.exerciseType };
    } else {
      const input = req.validatedBody as z.infer<typeof adminSessionSchema>;
      if (existing?.userId && existing.userId.toString() !== input.userId) throw new ValidationError("A workout's owner cannot be changed", [{ field: "userId", message: "Keep the existing owner" }]);
      if (!await User.exists({ _id: input.userId, ...(!editing ? { deletedAt: null } : {}) })) throw new ValidationError("A valid workout owner is required", [{ field: "userId", message: "User not found or inactive" }]);
      const ids = input.exercises.flatMap(item => item.exerciseId ? [item.exerciseId] : []);
      const available = await Exercise.find({ _id: { $in: ids }, deletedAt: null, $or: [{ isCustom: false, createdBy: null }, { createdBy: input.userId }] });
      if (ids.some(id => !available.some(item => item.id === id))) throw new ValidationError("Workout exercises must be available to its owner", [{ field: "exercises", message: "One or more exercises are unavailable" }]);
    }
    if (existing) { existing.set(data); await existing.save(); res.json(existing); }
    else {
      const item = resource === "exercises" ? await Exercise.create(data) : resource === "templates" ? await WorkoutTemplate.create(data) : await WorkoutSession.create(data);
      res.status(201).json(item);
    }
  };
}
export function deleteResource(resource: Resource): RequestHandler {
  return async (req, res) => {
    const id = String(req.params.id);
    if (resource === "exercises") {
      const referenced = await Promise.all([WorkoutTemplate.exists({ "exercises.exercise": id }), WorkoutDraft.exists({ "exercises.exerciseId": id }), WorkoutSession.exists({ "exercises.exerciseId": id })]);
      if (referenced.some(Boolean)) throw new ConflictError("This exercise is referenced by a template, draft, or workout. Edit it instead to preserve those records.");
    }
    const item = resource === "sessions"
      ? await WorkoutSession.findOneAndUpdate({ _id: id, deletedAt: null }, { $set: { deletedAt: new Date(), deletedBy: req.user!.id, deleteReason: "Deleted by admin" } })
      : await models[resource].findByIdAndDelete(id);
    if (!item) throw new NotFoundError("Resource not found");
    res.json({ message: "Resource deleted" });
  };
}
