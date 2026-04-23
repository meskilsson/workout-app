export const DIFFICULTY_OPTIONS = [
    "beginner",
    "intermediate",
    "advanced",
] as const;

export type Difficulty = (typeof DIFFICULTY_OPTIONS)[number];