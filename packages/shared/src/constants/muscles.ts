export const MUSCLE_OPTIONS = [
    "chest",
    "back",
    "shoulders",
    "biceps",
    "triceps",
    "quads",
    "hamstrings",
    "glutes",
    "calves",
    "core",
    "forearms",
] as const;

export type Muscle = (typeof MUSCLE_OPTIONS)[number];
