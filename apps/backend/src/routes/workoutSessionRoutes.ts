import { Router } from "express";

import {
    createWorkoutSession,
    getMyWorkoutSessions,
    getWorkoutSessionById,
    repeatWorkoutSession,
} from "../controllers/workoutSessionController";

import { requireAuth } from "../middleware/requireAuth";
import { validateRequest } from "../middleware/validate";

import {
    createWorkoutSessionSchema,
    workoutSessionIdParamsSchema,
} from "../schemas/workoutSessionSchemas";

const workoutSessionRouter = Router();

workoutSessionRouter.post(
    "/",
    requireAuth,
    validateRequest({ body: createWorkoutSessionSchema }),
    createWorkoutSession,
);

workoutSessionRouter.get(
    "/me",
    requireAuth,
    getMyWorkoutSessions,
);

workoutSessionRouter.post(
    "/:id/repeat",
    requireAuth,
    validateRequest({ params: workoutSessionIdParamsSchema }),
    repeatWorkoutSession,
);

workoutSessionRouter.get(
    "/:id",
    requireAuth,
    validateRequest({ params: workoutSessionIdParamsSchema }),
    getWorkoutSessionById,
);

export default workoutSessionRouter;