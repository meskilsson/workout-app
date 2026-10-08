import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { validateRequest } from '../middleware/validate'
import {
    abandonWorkoutDraft,
    completeWorkoutDraft,
    createWorkoutDraft,
    getCurrentWorkoutDraft,
    getWorkoutDraftById,
    reorderWorkoutDraftExercises,
    startWorkoutDraft,
    updateWorkoutDraftExercises,
    updateWorkoutDraftMuscleGroups,
    updateWorkoutDraftSets,
    updateWorkoutDraftTraining,
    addWorkoutDraftExercises,
    removeWorkoutDraftExercise,
} from "../controllers/workoutDraftController";
import {
    createWorkoutDraftSchema,
    updateWorkoutDraftExercisesSchema,
    updateWorkoutDraftMuscleGroupsSchema,
    updateWorkoutDraftSetsSchema,
    updateWorkoutDraftTrainingSchema,
    workoutDraftIdParamsSchema,
    reorderWorkoutDraftExercisesSchema,
    addWorkoutDraftExercisesSchema,
    workoutDraftExerciseParamsSchema,
} from "../schemas/workoutDraft.schema";

const workoutDraftRouter = Router();

workoutDraftRouter.use(requireAuth);

workoutDraftRouter.post(
    "/",
    validateRequest({
        body: createWorkoutDraftSchema,
    }),
    createWorkoutDraft,
);

workoutDraftRouter.get("/current", getCurrentWorkoutDraft);

workoutDraftRouter.get(
    "/:draftId",
    validateRequest({
        params: workoutDraftIdParamsSchema,
    }),
    getWorkoutDraftById,
);

workoutDraftRouter.patch(
    "/:draftId/muscle-groups",
    validateRequest({
        params: workoutDraftIdParamsSchema,
        body: updateWorkoutDraftMuscleGroupsSchema,
    }),
    updateWorkoutDraftMuscleGroups,
);

workoutDraftRouter.patch(
    "/:draftId/exercises",
    validateRequest({
        params: workoutDraftIdParamsSchema,
        body: updateWorkoutDraftExercisesSchema,
    }),
    updateWorkoutDraftExercises,
);

workoutDraftRouter.patch(
    "/:draftId/exercises/add",
    validateRequest({
        params: workoutDraftIdParamsSchema,
        body: addWorkoutDraftExercisesSchema,
    }),
    addWorkoutDraftExercises,
);

workoutDraftRouter.delete(
    "/:draftId/exercises/:exerciseId",
    validateRequest({
        params: workoutDraftExerciseParamsSchema,
    }),
    removeWorkoutDraftExercise,
);

workoutDraftRouter.patch(
    "/:draftId/start",
    validateRequest({
        params: workoutDraftIdParamsSchema,
    }),
    startWorkoutDraft,
);

workoutDraftRouter.patch(
    "/:draftId/sets",
    validateRequest({
        params: workoutDraftIdParamsSchema,
        body: updateWorkoutDraftSetsSchema,
    }),
    updateWorkoutDraftSets,
    updateWorkoutDraftTraining,
);

workoutDraftRouter.post(
    "/:draftId/complete",
    validateRequest({
        params: workoutDraftIdParamsSchema,
    }),
    completeWorkoutDraft,
);

workoutDraftRouter.patch(
    "/:draftId/abandon",
    validateRequest({
        params: workoutDraftIdParamsSchema,
    }),
    abandonWorkoutDraft,
);

workoutDraftRouter.patch(
    "/:draftId/exercises/order",
    validateRequest({ params: workoutDraftIdParamsSchema, body: reorderWorkoutDraftExercisesSchema }),
    reorderWorkoutDraftExercises,
);

workoutDraftRouter.patch("/:draftId/training", validateRequest({ params: workoutDraftIdParamsSchema, body: updateWorkoutDraftTrainingSchema }), updateWorkoutDraftTraining);
export default workoutDraftRouter;