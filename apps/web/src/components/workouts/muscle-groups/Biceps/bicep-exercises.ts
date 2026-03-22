import type { MuscleGroup } from "../types";



export const bicepsExercises: MuscleGroup = {
    id: "biceps",
    title: "Biceps",
    exercises: [
        { id: "dumbbell curl", name: "Dumbbell Curl", muscleGroup: "biceps" },
        { id: "dumbbell hammer curl", name: "Dumbell Hammer Curl", muscleGroup: "biceps" },
        { id: "close grip hammer curl", name: "Close Grip Hammer Curl", muscleGroup: "biceps" },
        { id: "cable curl", name: "Cable Curl", muscleGroup: "biceps" },
        { id: "spider curl", name: "Spider Curl", muscleGroup: "biceps" },
    ],
};
