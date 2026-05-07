import { Schema, model, Types } from "mongoose";
import { MUSCLE_OPTIONS, type Muscle } from "@workout-app/shared";

export type WorkoutDraftStatus =
    | "building"
    | "active"
    | "completed"
    | "abandoned";

export interface WorkoutDraftSet {
    weight: number | null;
    reps: number | null;
}

export interface WorkoutDraftExercise {
    exerciseId: Types.ObjectId;
    exerciseName: string;
    sets: WorkoutDraftSet[];
}

export interface IWorkoutDraft {
    userId: Types.ObjectId;
    status: WorkoutDraftStatus;
    selectedMuscleGroups: Muscle[];
    exercises: WorkoutDraftExercise[];
    startedAt?: Date | null;
    completedSessionId?: Types.ObjectId | null;
}

const workoutDraftSetSchema = new Schema<WorkoutDraftSet>(
    {
        weight: {
            type: Number,
            min: 0,
            default: null,
        },
        reps: {
            type: Number,
            min: 1,
            default: null,
        }
    },
    { _id: false },
);

const workoutDraftExerciseSchema = new Schema<WorkoutDraftExercise>(
    {
        exerciseId: {
            type: Schema.Types.ObjectId,
            ref: "Exercise",
            required: true,
        },
        exerciseName: {
            type: String,
            required: [true, "Exercise name is required"],
            trim: true,
        },
        sets: {
            type: [workoutDraftSetSchema],
            default: [],
        },
    },
    { _id: false },
);

const workoutDraftSchema = new Schema<IWorkoutDraft>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User is required"],
            index: true,
        },
        status: {
            type: String,
            enum: ["building", "active", "completed", "abandoned"],
            default: "building",
            index: true,
        },
        selectedMuscleGroups: {
            type: [{ type: String, enum: MUSCLE_OPTIONS }],
            default: [],
        },
        exercises: {
            type: [workoutDraftExerciseSchema],
            default: [],
        },
        startedAt: {
            type: Date,
            default: null,
        },
        completedSessionId: {
            type: Schema.Types.ObjectId,
            ref: "WorkoutSession",
            default: null,
        },
    },
    {
        timestamps: true,
    },
);

workoutDraftSchema.index({ userId: 1, status: 1, updatedAt: -1 });

const WorkoutDraft = model<IWorkoutDraft>("WorkoutDraft", workoutDraftSchema);

export default WorkoutDraft;
