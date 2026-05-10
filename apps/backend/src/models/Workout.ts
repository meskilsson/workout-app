import { Schema, model } from "mongoose";

export interface IWorkout {
  name: string;
  duration: number;
  difficulty?: "beginner" | "intermediate" | "advanced";
}

const workoutSchema = new Schema<IWorkout>(
  {
    name: {
      type: String,
      required: [true, "Workout name is required"],
      trim: true,
    },
    duration: {
      type: Number,
      required: [true, "Duration is required"],
      min: [1, "Duration must be at least 1 minute"],
    },
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
  },
  {
    timestamps: true,
  },
);

const Workout = model<IWorkout>("Workout", workoutSchema);

export default Workout;
