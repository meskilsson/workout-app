import { Router } from "express";
import {
  createWorkout,
  getWorkoutById,
  getAllWorkouts,
} from "../controllers/workoutController";

import {
  createWorkoutSchema,
  workoutIdParamsSchema,
} from "../schemas/workoutSchemas";

import { validateRequest } from "../middleware/validate";
import { requireAuth } from "../middleware/requireAuth";

const workoutRouter = Router();

workoutRouter.get("/", requireAuth, getAllWorkouts);

workoutRouter.get(
  "/:id",
  requireAuth,
  validateRequest({ params: workoutIdParamsSchema }),

  getWorkoutById,
);

workoutRouter.post(
  "/",
  requireAuth,
  validateRequest({ body: createWorkoutSchema }),
  createWorkout,
);

export default workoutRouter;