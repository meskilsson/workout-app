import type { MuscleGroup } from "../types";

export const backExercises: MuscleGroup = {
  id: "back",
  title: "Back",
  exercises: [
    { id: "barbell-row", name: "Barbell Row", muscleGroup: "back" },
    {
      id: "wide-grip-cable-row",
      name: "Wide Grip Cable Row",
      muscleGroup: "back",
    },
    { id: "pull-up", name: "Pull Up", muscleGroup: "back" },
    { id: "lat-pull-down", name: "Lat Pull Down", muscleGroup: "back" },
    {
      id: "close-grip-cable-row",
      name: "Close Grip Cable Row",
      muscleGroup: "back",
    },
  ],
};
