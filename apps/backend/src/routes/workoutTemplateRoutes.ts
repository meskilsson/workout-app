import { Router } from "express";

import {
    createWorkoutTemplate,
    deleteWorkoutTemplate,
    getMyWorkoutTemplateById,
    getMyWorkoutTemplates,
    getPublicWorkoutTemplateById,
    getPublicWorkoutTemplates,
    startWorkoutFromTemplate,
    updateWorkoutTemplate,
} from "../controllers/workoutTemplateController";

import { requireAuth } from "../middleware/requireAuth";
import { validateRequest } from "../middleware/validate";
import {
    createWorkoutTemplateSchema,
    updateWorkoutTemplateSchema,
    workoutTemplateIdParamSchema,
} from "../schemas/workoutTemplateSchemas";

const workoutTemplateRouter = Router();

workoutTemplateRouter.get("/public", getPublicWorkoutTemplates);

workoutTemplateRouter.get(
    "/public/:templateId",
    validateRequest({
        params: workoutTemplateIdParamSchema,
    }),
    getPublicWorkoutTemplateById,
);

workoutTemplateRouter.get(
    "/my",
    requireAuth,
    getMyWorkoutTemplates,
);

workoutTemplateRouter.get(
    "/my/:templateId",
    requireAuth,
    validateRequest({
        params: workoutTemplateIdParamSchema,
    }),
    getMyWorkoutTemplateById,
);

workoutTemplateRouter.post(
    "/",
    requireAuth,
    validateRequest({
        body: createWorkoutTemplateSchema,
    }),
    createWorkoutTemplate,
);

workoutTemplateRouter.patch(
    "/:templateId",
    requireAuth,
    validateRequest({
        params: workoutTemplateIdParamSchema,
        body: updateWorkoutTemplateSchema,
    }),
    updateWorkoutTemplate,
);

workoutTemplateRouter.delete(
    "/:templateId",
    requireAuth,
    validateRequest({
        params: workoutTemplateIdParamSchema,
    }),
    deleteWorkoutTemplate,
);

workoutTemplateRouter.post(
    "/:templateId/start",
    requireAuth,
    validateRequest({
        params: workoutTemplateIdParamSchema,
    }),
    startWorkoutFromTemplate,
);

export default workoutTemplateRouter;