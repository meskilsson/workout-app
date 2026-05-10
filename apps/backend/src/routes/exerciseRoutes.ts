import { Router } from "express";
import {
    createExercise,
    getExerciseById,
    getExerciseLibrary,
    getPublicExercises,
    deleteExercise,
    updateExercise

} from "../controllers/exerciseController";
import { requireAuth } from "../middleware/requireAuth";
import { createExerciseSchema, updateExerciseSchema, exerciseIdParamsSchema } from "../schemas/exerciseSchemas";
import { validateRequest } from "../middleware/validate";

const exerciseRouter = Router();

exerciseRouter.get("/", getPublicExercises);
exerciseRouter.get("/library", requireAuth, getExerciseLibrary);
exerciseRouter.get("/:id", validateRequest({ params: exerciseIdParamsSchema }), getExerciseById);

exerciseRouter.post("/", requireAuth, validateRequest({ body: createExerciseSchema }), createExercise);


exerciseRouter.patch("/:id", requireAuth, validateRequest({ params: exerciseIdParamsSchema, body: updateExerciseSchema }), updateExercise);

exerciseRouter.delete("/:id", requireAuth, validateRequest({ params: exerciseIdParamsSchema }), deleteExercise);

export default exerciseRouter;