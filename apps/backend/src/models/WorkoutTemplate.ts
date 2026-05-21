import { Schema, model, Types } from "mongoose";

export type WorkoutTemplateCategory =
    | "full_body"
    | "push"
    | "pull"
    | "legs"
    | "upper"
    | "lower"
    | "custom";

export type WorkoutTemplateSet = {
    reps?: number | null;
    weight?: number | null;
    restSeconds?: number | null;
    notes?: string;
};

export type WorkoutTemplateExercise = {
    exercise: Types.ObjectId;
    exerciseName: string;
    order: number;
    plannedSets: WorkoutTemplateSet[];
};

export type WorkoutTemplateDocument = {
    name: string;
    description?: string;
    category?: WorkoutTemplateCategory;
    isPublic: boolean;
    createdBy?: Types.ObjectId | null;
    exercises: WorkoutTemplateExercise[];
    createdAt: Date;
    updatedAt: Date;
};

const workoutTemplateSetSchema = new Schema<WorkoutTemplateSet>(
    {
        reps: {
            type: Number,
            min: 0,
            default: null,
        },
        weight: {
            type: Number,
            min: 0,
            default: null,
        },
        restSeconds: {
            type: Number,
            min: 0,
            default: null,
        },
        notes: {
            type: String,
            trim: true,
            default: "",
        },
    },
    {
        _id: false,
    },
);


const workoutTemplateExerciseSchema = new Schema<WorkoutTemplateExercise>(
    {
        exercise: {
            type: Schema.Types.ObjectId,
            ref: "Exercise",
            required: true,
        },
        exerciseName: {
            type: String,
            required: true,
            trim: true,
        },
        order: {
            type: Number,
            required: true,
            min: 0,
        },
        plannedSets: {
            type: [workoutTemplateSetSchema],
            default: [],
        },
    },
    {
        _id: true,
    },
);

const workoutTemplateSchema = new Schema<WorkoutTemplateDocument>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 80,
        },
        description: {
            type: String,
            trim: true,
            default: "",
            maxlength: 500,
        },
        category: {
            type: String,
            enum: [
                "full_body",
                "push",
                "pull",
                "legs",
                "upper",
                "lower",
                "custom",
            ],
            default: "custom",
        },
        isPublic: {
            type: Boolean,
            required: true,
            default: false,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        exercises: {
            type: [workoutTemplateExerciseSchema],
            default: [],
        },
    },
    {
        timestamps: true,
    },
);

workoutTemplateSchema.index({ isPublic: 1, createdAt: -1 });
workoutTemplateSchema.index({ createdBy: 1, createdAt: -1 });

const WorkoutTemplate = model<WorkoutTemplateDocument>(
    "WorkoutTemplate",
    workoutTemplateSchema,
);

export default WorkoutTemplate