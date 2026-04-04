import type { MuscleGroup } from "../types"

export const chestExercises: MuscleGroup = {
    id: "chest",
    title: "Chest",
    exercises: [
        { id: "bench press", name: "Bench Press", muscleGroup: "chest" },
        { id: "incline bench press", name: "Incline Bench Press", muscleGroup: "chest" },
        { id: "dumbbell press", name: "Dumbbell Press", muscleGroup: "chest" },
        { id: "incline dumbbell press", name: "Incline Dumbbell Press", muscleGroup: "chest" },
        { id: "cable flyes", name: "Cable Flyes", muscleGroup: "chest" },
    ]
}