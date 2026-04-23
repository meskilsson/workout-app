import { Schema, model, Types } from "mongoose";
import {
    MUSCLE_OPTIONS,
    EQUIPMENT_OPTIONS,
    DIFFICULTY_OPTIONS,
    EXERCISE_TYPE_OPTIONS,
    type Muscle,
    type Equipment,
    type Difficulty,
    type ExerciseType,
} from "@workout-app/shared";

export interface IExercise {
    name: string;
    description?: string;
    instructions?: string;
    exerciseType?: ExerciseType;
    primaryMuscles?: Muscle[];
    secondaryMuscles?: Muscle[];
    equipment?: Equipment;
    difficulty?: Difficulty;
    videoUrl?: string;
    imageUrl?: string;
    isCustom: boolean;
    createdBy?: Types.ObjectId | null;
}

const exerciseSchema = new Schema<IExercise>(
    {
        name: {
            type: String,
            required: [true, "Exercise name is required"],
            trim: true,
            minlength: [2, "Exercise name has to be at least 2 characters"],
            maxlength: [50, "Exercise name cannot be more than 50 characters"],
        },
        description: {
            type: String,
            trim: true,
            default: "",
        },
        instructions: {
            type: String,
            trim: true,
            default: "",
        },
        exerciseType: {
            type: String,
            enum: EXERCISE_TYPE_OPTIONS,
        },
        primaryMuscles: {
            type: [{ type: String, enum: MUSCLE_OPTIONS }],
            default: [],
        },
        secondaryMuscles: {
            type: [{ type: String, enum: MUSCLE_OPTIONS }],
            default: [],
        },
        equipment: {
            type: String,
            enum: EQUIPMENT_OPTIONS,
        },
        difficulty: {
            type: String,
            enum: DIFFICULTY_OPTIONS,
        },
        videoUrl: {
            type: String,
            trim: true,
            default: "",
        },
        imageUrl: {
            type: String,
            trim: true,
            default: "",
        },
        isCustom: {
            type: Boolean,
            default: false,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
    },
    {
        timestamps: true,
    },
);

const Exercise = model<IExercise>("Exercise", exerciseSchema);

export default Exercise;