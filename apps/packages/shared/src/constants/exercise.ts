export const EXERCISE_TYPE_OPTIONS = [
    "strength",
    "cardio",
    "mobility",
] as const;

export type ExerciseType = (typeof EXERCISE_TYPE_OPTIONS)[number];