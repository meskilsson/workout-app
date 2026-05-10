import { NotFoundError } from "../errors/AppError";
import Workout, { IWorkout } from "../models/Workout";

export async function createWorkout(workoutData: IWorkout) {
  const workout = await Workout.create(workoutData);
  return workout;
}

export async function getAllWorkouts() {
  const workouts = await Workout.find().sort({ createdAt: -1 });
  return workouts;
}

export async function getWorkoutById(id: string) {
  const workout = await Workout.findById(id);

  if (!workout) {
    throw new NotFoundError("Workout not found");
  }

  return workout;
}
