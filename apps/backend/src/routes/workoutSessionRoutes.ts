import { Router } from "express";
import { createWorkoutSession, getMyWorkoutSessions, getWorkoutSessionById } from "../controllers/workoutSessionController";
import { requireAuth } from "../middleware/requireAuth";

const workoutSessionRouter = Router();

workoutSessionRouter.post("/", requireAuth, createWorkoutSession);
workoutSessionRouter.get("/me", requireAuth, getMyWorkoutSessions);
workoutSessionRouter.get("/:id", requireAuth, getWorkoutSessionById);

export default workoutSessionRouter;