import type { MuscleGroup } from "../types"

export const shoulderExercises: MuscleGroup = {
    id: "shoulders",
    title: "Shoulders",
    exercises: [
        { id: "military press", name: "Military Press", muscleGroup: "shoulders" },
        { id: "dumbell shoulder press", name: "Dumbbell Shoulder Press", muscleGroup: "shoulders" },
        { id: "front delt raise", name: "Front Delt Raise", muscleGroup: "shoulders" },
        { id: "side delt raise", name: "Side Delt Raise", muscleGroup: "shoulders" },
        { id: "face pull", name: "Face Pull", muscleGroup: "shoulders" },
    ]
}