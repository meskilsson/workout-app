import { Types } from "mongoose";
import { MUSCLE_OPTIONS, type Muscle } from "@workout-app/shared";
import Exercise from "../models/Exercises";
import WorkoutDraft from "../models/WorkoutDraft";
import { createWorkoutSession } from "./workoutSessionService";
import { ValidationError } from "../errors/AppError";

interface CreateWorkoutDraftInput {
    selectedMuscleGroups?: unknown;
}

interface UpdatedMuscleGroupsInput {
    selectedMuscleGroups?: unknown;
}

interface UpdateExercisesInput {
    exerciseIds?: unknown;
}

interface WorkoutDraftSetInput {
    weight?: string | number | null;
    reps?: string | number | null;
}

interface UpdateExerciseSetsInput {
    exerciseId?: unknown;
    sets?: unknown;
}

const editableStatuses = ["building", "active"];
const muscleOptionSet = new Set<string>(MUSCLE_OPTIONS);

function normalizeMuscleGroups(value: unknown): Muscle[] {
    if (!Array.isArray(value)) {
        throw new ValidationError("selectedMuscleGroups must be an array");
    }

    const uniqueMuscles = new Set<Muscle>();

    for (const muscle of value) {
        if (typeof muscle !== "string") {
            throw new ValidationError("Each muscle group must be a string");
        }

        const normalizedMuscle = muscle.trim().toLowerCase();

        if (!muscleOptionSet.has(normalizedMuscle)) {
            throw new ValidationError(`Invalid muscle group: ${muscle}`);
        }

        uniqueMuscles.add(normalizedMuscle as Muscle);
    }

    if (uniqueMuscles.size === 0) {
        throw new ValidationError("At least one muscle group is required");
    }

    return [...uniqueMuscles];
}

function normalizeObjectId(value: unknown, fieldName: string) {
    if (typeof value !== "string" || !Types.ObjectId.isValid(value)) {
        throw new ValidationError(`Invalid ${fieldName}`);
    }

    return new Types.ObjectId(value);
}