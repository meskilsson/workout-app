import type { WorkoutDraft } from "../services/workoutDraftApi";
export function firstInvalidSet(draft: Pick<WorkoutDraft, "exercises">) {
  for (const exercise of draft.exercises)
    for (let index = 0; index < exercise.sets.length; index++)
      for (const field of ["weight", "reps"] as const) {
        const value = exercise.sets[index][field];
        if (value === null || value === "") continue;
        const n = Number(value);
        if (
          !Number.isFinite(n) ||
          n < (field === "weight" ? 0 : 1) ||
          (field === "reps" && !Number.isInteger(n))
        )
          return {
            id: `${exercise.exerciseId}:${index}:${field}`,
            field,
            message:
              field === "weight"
                ? "Enter a weight of 0 or more."
                : "Enter a whole number of reps of 1 or more.",
          };
      }
  return null;
}
