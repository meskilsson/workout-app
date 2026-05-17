import { Schema, model, Types } from "mongoose";

interface WorkoutSet {
    weight: number;
    reps: number;
};

interface WorkoutSessionExercise {
    exerciseId: Types.ObjectId | null;
    exerciseName: string;
    sets: WorkoutSet[];
};

export interface IWorkoutSession {
    userId: Types.ObjectId;
    exercises: WorkoutSessionExercise[];
    startedAt: Date;
    endedAt: Date;
    deletedAt?: Date | null;
    deletedBy?: Types.ObjectId | null;
    deleteReason?: string | null;
};

const workoutSetSchema = new Schema<WorkoutSet>(
    {
        weight: {
            type: Number,
            required: true,
            min: 0,
        },
        reps: {
            type: Number,
            required: true,
            min: 1,
        },
    },
    { _id: false },
);

const workoutSessionExerciseSchema = new Schema<WorkoutSessionExercise>(
    {
        exerciseId: {
            type: Schema.Types.ObjectId,
            ref: "Exercise",
            default: null,
        },
        exerciseName: {
            type: String,
            required: [true, "Exercise name is required"],
            trim: true,
        },
        sets: {
            type: [workoutSetSchema],
            required: true,
            validate: {
                validator: (value: WorkoutSet[]) => value.length > 0,
                message: "At least one set is required",
            },
        },
    },
    { _id: false },
);

const workoutSessionSchema = new Schema<IWorkoutSession>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User is required"],
        },
        exercises: {
            type: [workoutSessionExerciseSchema],
            required: true,
            validate: {
                validator: (value: WorkoutSessionExercise[]) => value.length > 0,
                message: "At least one exercise is required",
            },
        },
        startedAt: {
            type: Date,
            required: [true, "Workout start time is required"],
        },
        endedAt: {
            type: Date,
            required: [true, "Workout end time is required"],
        },
        deletedAt: {
            type: Date,
            default: null,
        },
        deletedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        deleteReason: {
            type: String,
            trim: true,
            default: null,
        },
    },
    {
        timestamps: true,
    },
);

const WorkoutSession = model<IWorkoutSession>("WorkoutSession", workoutSessionSchema);

export default WorkoutSession;