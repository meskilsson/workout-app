import { Router } from "express";
import { createWorkoutSession, getMyWorkoutSessions, getWorkoutSessionById } from "../controllers/workoutSessionController";
import { requireAuth } from "../middleware/requireAuth";
import { createWorkoutSessionSchema, workoutSessionIdParamsSchema } from "../schemas/workoutSessionSchemas";
import { validateRequest } from "../middleware/validate";

const workoutSessionRouter = Router();

workoutSessionRouter.post("/", requireAuth, validateRequest({ body: createWorkoutSessionSchema }), createWorkoutSession);
workoutSessionRouter.get("/me", requireAuth, getMyWorkoutSessions);
workoutSessionRouter.get("/:id", requireAuth, validateRequest({ params: workoutSessionIdParamsSchema }), getWorkoutSessionById);

export default workoutSessionRouter;