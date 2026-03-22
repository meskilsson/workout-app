import { backExercises } from './Back/back-exercises';
import { bicepsExercises } from './Biceps/bicep-exercises';
import { chestExercises } from './Chest/chest-exercises';
import { legExercises } from './Legs/leg-exercises';
import { shoulderExercises } from './Shoulders/shoulder-exercises';
import { tricepExercises } from './Triceps/triceps-exercises';

export const muscleGroups = [
    ...backExercises,
    ...bicepsExercises,
    ...chestExercises,
    ...legExercises,
    ...shoulderExercises,
    ...tricepExercises,
];