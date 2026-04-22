import { Router } from "express";
import {
    createExercise,
    getExerciseById,
    getExerciseLibrary,
    getPublicExercises,

} from "../controllers/exerciseController";
import { requireAuth } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";

const exerciseRouter = Router();

exerciseRouter.get("/", getPublicExercises);
exerciseRouter.get("/library", requireAuth, getExerciseLibrary);
exerciseRouter.get("/:id", getExerciseById);

exerciseRouter.post("/", requireAuth, requireRole("user", "admin"), createExercise);


export default exerciseRouter;