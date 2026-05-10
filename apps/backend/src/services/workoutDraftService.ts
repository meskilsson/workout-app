import { Types } from 'mongoose';
import { MUSCLE_OPTIONS, type Muscle } from "@workout-app/shared";
import Exercise from "../models/Exercises";
import WorkoutDraft from "../models/WorkoutDraft";
import { createWorkoutSession } from './workoutSessionService';
import { createHttpError } from '../utils/createHttpError';

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
        throw createHttpError("selectedMuscleGroups must be an array", 400);
    }

    const uniqueMuscles = new Set<Muscle>();

    for (const muscle of value) {
        if (typeof muscle !== "string") {
            throw createHttpError("Each muscle group must be a string", 400);
        }

        const normalizedMuscle = muscle.trim().toLowerCase();


        if (!muscleOptionSet.has(normalizedMuscle)) {
            throw createHttpError(`Invalid muscle group: ${muscle}`, 400);
        }

        uniqueMuscles.add(normalizedMuscle as Muscle);
    }

    if (uniqueMuscles.size === 0) {
        throw createHttpError("At least one muscle group is required", 400);
    }

    return [...uniqueMuscles];

}

function normalizeObjectId(value: unknown, fieldName: string) {
    if (typeof value !== "string" || !Types.ObjectId.isValid(value)) {
        throw createHttpError(`Invalid ${fieldName}`, 400);
    }

    return new Types.ObjectId(value);
}