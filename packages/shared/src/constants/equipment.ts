export const EQUIPMENT_OPTIONS = [
    "bodyweight",
    "dumbbell",
    "barbell",
    "machine",
    "kettlebell",
    "band",
] as const;

export type Equipment = (typeof EQUIPMENT_OPTIONS)[number];