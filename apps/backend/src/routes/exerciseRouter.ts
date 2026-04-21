import { Router } from "express";
import { createExercise } from "../controllers/exerciseController";
import { requireAuth } from "../middleware/requireAuth";

const exerciseRouter = Router();

exerciseRouter.post("/", requireAuth, createExercise);

export default exerciseRouter;