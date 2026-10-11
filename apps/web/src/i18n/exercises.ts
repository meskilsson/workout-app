import type { Exercise } from "@workout-app/shared";
import i18n from "./index";

// Localize presentation only; keep original values in forms, requests and snapshots.
export function exerciseText(exercise: Pick<Exercise, "name" | "description" | "instructions" | "isCustom" | "createdBy" | "translations">,
    field: "name" | "description" | "instructions" = "name"): string {
    const original = exercise[field] ?? "";
    if (i18n.resolvedLanguage !== "sv" || exercise.isCustom !== false || exercise.createdBy != null) return original;
    return exercise.translations?.sv?.[field]?.trim() || original;
}

export function snapshotExerciseName(exercise: Parameters<typeof exerciseText>[0] | undefined, savedName: string): string {
    // Renaming an exercise must not rewrite the meaning of historical snapshots.
    return exercise?.name === savedName ? exerciseText(exercise) : savedName;
}
