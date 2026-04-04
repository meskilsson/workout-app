import { backExercises } from "./back-exercises";
import { bicepsExercises } from "./bicep-exercises";
import { chestExercises } from "./chest-exercises";
import { legExercises } from "./leg-exercises";
import { shoulderExercises } from "./shoulder-exercises";
import { tricepExercises } from "./triceps-exercises";
import type { MuscleGroup, Exercise } from "../types";

export const muscleGroups: MuscleGroup[] = [
  backExercises,
  bicepsExercises,
  chestExercises,
  legExercises,
  shoulderExercises,
  tricepExercises,
];

export const allExercises: Exercise[] = [
  ...backExercises.exercises,
  ...bicepsExercises.exercises,
  ...chestExercises.exercises,
  ...legExercises.exercises,
  ...shoulderExercises.exercises,
  ...tricepExercises.exercises,
];
