import { Schema, model, Types } from "mongoose";

export interface IExercise {
    name: string;
    description?: string;
    instructions?: string;
    exerciseType?: "strength" | "cardio" | "mobility";
    primaryMuscles?: string[];
    secondaryMuscles?: string[];
    equipment?: "bodyweight" | "dumbbell" | "barbell" | "machine" | "kettlebell" | "band";
    difficulty?: "beginner" | "intermediate" | "advanced";
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
            enum: ["strength", "cardio", "mobility"],
        },
        primaryMuscles: {
            type: [String],
            default: [],
        },
        secondaryMuscles: {
            type: [String],
            default: [],
        },
        equipment: {
            type: String,
            enum: ["bodyweight", "dumbbell", "barbell", "machine", "kettlebell", "band"],
        },
        difficulty: {
            type: String,
            enum: ["beginner", "intermediate", "advanced"],
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