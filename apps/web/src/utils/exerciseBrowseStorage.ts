import { EXERCISE_TYPE_OPTIONS, EQUIPMENT_OPTIONS, DIFFICULTY_OPTIONS, MUSCLE_OPTIONS, type ExerciseFilters, type ExerciseSort } from "@workout-app/shared";

export type ExerciseBrowseState = { search: string; sort: ExerciseSort; filters: ExerciseFilters; page: number };
export const freshExerciseBrowseState = (): ExerciseBrowseState => ({ search: "", sort: "popular", filters: {}, page: 1 });
export const exerciseBrowseKey = (userId: string | undefined, draftId?: string) =>
    `exercise-browse:v1:${userId ?? "public"}:${draftId ? `draft:${draftId}` : "library"}`;

export function readExerciseBrowseState(key: string, storage?: Pick<Storage, "getItem">): ExerciseBrowseState {
    const result = freshExerciseBrowseState();
    try {
        const saved = JSON.parse(storage?.getItem(key) ?? "null");
        if (!saved || typeof saved !== "object") return result;
        if (typeof saved.search === "string") result.search = saved.search;
        if (["name", "popular", "mostUsed"].includes(saved.sort)) result.sort = saved.sort;
        if (Number.isSafeInteger(saved.page) && saved.page > 0) result.page = saved.page;
        const filters = saved.filters;
        if (filters && typeof filters === "object") {
            if (EXERCISE_TYPE_OPTIONS.includes(filters.exerciseType)) result.filters.exerciseType = filters.exerciseType;
            if (EQUIPMENT_OPTIONS.includes(filters.equipment)) result.filters.equipment = filters.equipment;
            if (DIFFICULTY_OPTIONS.includes(filters.difficulty)) result.filters.difficulty = filters.difficulty;
            if (Array.isArray(filters.muscles)) result.filters.muscles = [...new Set<string>(filters.muscles)].filter(value => MUSCLE_OPTIONS.some(muscle => muscle === value)) as ExerciseFilters["muscles"];
        }
    } catch { /* Unavailable or malformed storage should behave like a fresh visit. */ }
    return result;
}
