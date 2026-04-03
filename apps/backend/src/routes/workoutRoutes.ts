import { Router } from "express";
import {
  createWorkout,
  getWorkoutById,
  getAllWorkouts,
} from "../controllers/workoutController";

const workoutRouter = Router();

workoutRouter.get("/", getAllWorkouts);
workoutRouter.get("/:id", getWorkoutById);
workoutRouter.post("/", createWorkout);

export default workoutRouter;
