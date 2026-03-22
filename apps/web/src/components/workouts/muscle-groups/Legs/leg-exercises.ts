import type { MuscleGroup } from "../types"

export const legExercises: MuscleGroup = {
    id: "legs",
    title: "Legs",
    exercises: [
        { id: "squat", name: "Squat", muscleGroup: "legs" },
        { id: "romanian deadlift", name: "Romanian Deadlift", muscleGroup: "legs" },
        { id: "lunge", name: "Lunge", muscleGroup: "legs" },
        { id: "hamstring curl", name: "Hamstring Curl", muscleGroup: "legs" },
        { id: "leg extension", name: "Leg Extension", muscleGroup: "legs" },
    ]
}