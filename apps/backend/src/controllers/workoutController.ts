import { Request, Response, NextFunction } from "express";
import * as workoutService from "../services/workoutService";
import type { IdParams } from "../types";

export async function createWorkout(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const workout = await workoutService.createWorkout(req.body);
    res.status(201).json(workout);
  } catch (error) {
    next(error);
  }
}

export async function getAllWorkouts(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const workouts = await workoutService.getAllWorkouts();
    res.status(200).json(workouts);
  } catch (error) {
    next(error);
  }
}

export async function getWorkoutById(
  req: Request<IdParams>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const workout = await workoutService.getWorkoutById(req.params.id);
    res.status(200).json(workout);
  } catch (error) {
    next(error);
  }
}
