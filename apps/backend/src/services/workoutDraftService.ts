import { Types } from "mongoose";
import { MUSCLE_OPTIONS, type Muscle } from "@workout-app/shared";
import Exercise from "../models/Exercises";
import WorkoutDraft from "../models/WorkoutDraft";
import { createWorkoutSession } from "./workoutSessionService";
import { ConflictError, NotFoundError, ValidationError } from "../errors/AppError";

interface CreateWorkoutDraftInput {
    selectedMuscleGroups?: unknown;
}

interface UpdateMuscleGroupsInput {
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

type CompletedWorkoutSet = {
    weight: number;
    reps: number;
};

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

function normalizeObjectId(value: unknown, fieldName: string): Types.ObjectId {
    if (typeof value !== "string" || !Types.ObjectId.isValid(value)) {
        throw new ValidationError(`Invalid ${fieldName}`);
    }

    return new Types.ObjectId(value);
}

function normalizeExerciseIds(value: unknown): string[] {
    if (!Array.isArray(value)) {
        throw new ValidationError("exerciseIds must be an array");
    }

    const uniqueIds = new Set<string>();

    for (const exerciseId of value) {
        const objectId = normalizeObjectId(exerciseId, "exercise id");
        uniqueIds.add(objectId.toString());
    }

    if (uniqueIds.size === 0) {
        throw new ValidationError("At least one exercise is required");
    }

    return [...uniqueIds];
}

function normalizeNullableNumber(
    value: string | number | null | undefined,
    fieldName: "weight" | "reps",
): number | null {
    if (value === null || value === undefined || value === "") {
        return null;
    }

    if (typeof value === "string" && value.trim() === "") {
        return null;
    }

    const numberValue = Number(value);

    if (!Number.isFinite(numberValue)) {
        throw new ValidationError(`${fieldName} must be a number`);
    }

    const minimumValue = fieldName === "weight" ? 0 : 1;

    if (numberValue < minimumValue) {
        throw new ValidationError(`${fieldName} must be at least ${minimumValue}`);
    }

    return numberValue;
}

function normalizeDraftSets(value: unknown) {
    if (!Array.isArray(value)) {
        throw new ValidationError("sets must be an array");
    }

    return value.map((set) => {
        if (!set || typeof set !== "object") {
            throw new ValidationError("Each set must be an object");
        }

        const draftSet = set as WorkoutDraftSetInput;

        return {
            weight: normalizeNullableNumber(draftSet.weight, "weight"),
            reps: normalizeNullableNumber(draftSet.reps, "reps"),
        };
    });
}

function isCompletedWorkoutSet(set: {
    weight: number | null;
    reps: number | null;
}): set is CompletedWorkoutSet {
    return (
        typeof set.weight === "number" &&
        Number.isFinite(set.weight) &&
        set.weight >= 0 &&
        typeof set.reps === "number" &&
        Number.isFinite(set.reps) &&
        set.reps > 0
    );
}

async function getOwnedDraft(draftId: string, userId: string) {
    const objectId = normalizeObjectId(draftId, "workout draft id");

    const draft = await WorkoutDraft.findOne({
        _id: objectId,
        userId,
    });

    if (!draft) {
        throw new NotFoundError("Workout draft not found");
    }

    return draft;
}

function ensureDraftIsBuilding(status: string) {
    if (status !== "building") {
        throw new ConflictError(
            "This draft can only be changed before the workout starts",
        );
    }
}

function ensureDraftIsActive(status: string) {
    if (status !== "active") {
        throw new ConflictError("This draft is not an active workout");
    }
}

function exerciseMatchesSelectedMuscle(
    exercise: {
        primaryMuscles?: Muscle[];
        secondaryMuscles?: Muscle[];
    },
    selectedMuscleGroups: Muscle[],
) {
    const exerciseMuscles = [
        ...(exercise.primaryMuscles ?? []),
        ...(exercise.secondaryMuscles ?? []),
    ];

    return exerciseMuscles.some((muscle) =>
        selectedMuscleGroups.includes(muscle),
    );
}

export async function createWorkoutDraft(
    draftData: CreateWorkoutDraftInput,
    userId: string,
) {
    const selectedMuscleGroups = normalizeMuscleGroups(
        draftData.selectedMuscleGroups,
    );

    await WorkoutDraft.updateMany(
        {
            userId,
            status: { $in: editableStatuses },
        },
        {
            $set: { status: "abandoned" },
        },
    );

    const draft = await WorkoutDraft.create({
        userId,
        status: "building",
        selectedMuscleGroups,
        exercises: [],
        startedAt: null,
        completedSessionId: null,
    });

    return draft;
}

export async function getCurrentWorkoutDraft(userId: string) {
    const draft = await WorkoutDraft.findOne({
        userId,
        status: { $in: editableStatuses },
    }).sort({ updatedAt: -1 });

    return draft;
}

export async function getWorkoutDraftById(draftId: string, userId: string) {
    return getOwnedDraft(draftId, userId);
}

export async function updateWorkoutDraftMuscleGroups(
    draftId: string,
    muscleGroupData: UpdateMuscleGroupsInput,
    userId: string,
) {
    const draft = await getOwnedDraft(draftId, userId);

    ensureDraftIsBuilding(draft.status);

    draft.selectedMuscleGroups = normalizeMuscleGroups(
        muscleGroupData.selectedMuscleGroups,
    );

    draft.exercises = [];

    await draft.save();

    return draft;
}

export async function updateWorkoutDraftExercises(
    draftId: string,
    exerciseData: UpdateExercisesInput,
    userId: string,
) {
    const draft = await getOwnedDraft(draftId, userId);

    ensureDraftIsBuilding(draft.status);

    const exerciseIds = normalizeExerciseIds(exerciseData.exerciseIds);

    const exercises = await Exercise.find({
        _id: { $in: exerciseIds },
        $or: [{ isCustom: false, createdBy: null }, { createdBy: userId }],
    });

    if (exercises.length !== exerciseIds.length) {
        throw new ValidationError(
            "One or more exercises were not found or are not available to you",
        );
    }

    const existingSetsByExerciseId = new Map(
        draft.exercises.map((exercise) => [
            exercise.exerciseId.toString(),
            exercise.sets,
        ]),
    );

    const exercisesById = new Map(
        exercises.map((exercise) => [
            (exercise._id as Types.ObjectId).toString(),
            exercise,
        ]),
    );

    const selectedMuscleGroups = draft.selectedMuscleGroups;

    draft.exercises = exerciseIds.map((exerciseId) => {
        const exercise = exercisesById.get(exerciseId);

        if (!exercise) {
            throw new ValidationError("Exercise not found");
        }

        if (!exerciseMatchesSelectedMuscle(exercise, selectedMuscleGroups)) {
            throw new ValidationError(
                `${exercise.name} does not match your selected muscle groups`,
            );
        }

        return {
            exerciseId: exercise._id as Types.ObjectId,
            exerciseName: exercise.name,
            sets: existingSetsByExerciseId.get(exerciseId) ?? [],
        };
    });

    await draft.save();

    return draft;
}

export async function startWorkoutDraft(draftId: string, userId: string) {
    const draft = await getOwnedDraft(draftId, userId);

    ensureDraftIsBuilding(draft.status);

    if (draft.exercises.length === 0) {
        throw new ValidationError("Add at least one exercise before starting");
    }

    draft.status = "active";
    draft.startedAt = draft.startedAt ?? new Date();

    await draft.save();

    return draft;
}

export async function updateWorkoutDraftSets(
    draftId: string,
    setData: UpdateExerciseSetsInput,
    userId: string,
) {
    const draftObjectId = normalizeObjectId(draftId, "workout draft id");

    const exerciseObjectId = normalizeObjectId(
        setData.exerciseId,
        "exercise id",
    );

    const normalizedSets = normalizeDraftSets(setData.sets);

    const updatedDraft = await WorkoutDraft.findOneAndUpdate(
        {
            _id: draftObjectId,
            userId,
            status: "active",
            "exercises.exerciseId": exerciseObjectId,
        },
        {
            $set: {
                "exercises.$.sets": normalizedSets,
            },
        },
        {
            returnDocument: "after",
            runValidators: true,
        },
    );

    if (updatedDraft) {
        return updatedDraft;
    }

    const draft = await WorkoutDraft.findOne({
        _id: draftObjectId,
        userId,
    });

    if (!draft) {
        throw new NotFoundError("Workout draft not found");
    }

    ensureDraftIsActive(draft.status);

    const exerciseExists = draft.exercises.some(
        (draftExercise) =>
            draftExercise.exerciseId.toString() === exerciseObjectId.toString(),
    );

    if (!exerciseExists) {
        throw new NotFoundError("Exercise is not part of this draft");
    }

    throw new ValidationError("Failed to update workout draft sets");
}

export async function completeWorkoutDraft(draftId: string, userId: string) {
    const draft = await getOwnedDraft(draftId, userId);

    ensureDraftIsActive(draft.status);

    const exercises = draft.exercises.map((exercise) => {
        const validSets = exercise.sets.filter(isCompletedWorkoutSet);

        if (validSets.length === 0) {
            throw new ValidationError(
                `At least one valid set is required for ${exercise.exerciseName}`,
            );
        }

        return {
            exerciseId: exercise.exerciseId.toString(),
            exerciseName: exercise.exerciseName,
            sets: validSets,
        };
    });

    const workoutSession = await createWorkoutSession(
        {
            exercises,
            startedAt: draft.startedAt?.toISOString(),
            endedAt: new Date().toISOString(),
        },
        userId,
    );

    draft.status = "completed";
    draft.completedSessionId = workoutSession._id as Types.ObjectId;

    await draft.save();

    return workoutSession;
}

export async function abandonWorkoutDraft(draftId: string, userId: string) {
    const draft = await getOwnedDraft(draftId, userId);

    if (draft.status === "completed") {
        throw new ConflictError("Completed drafts cannot be abandoned");
    }

    if (draft.status === "abandoned") {
        return draft;
    }

    draft.status = "abandoned";

    await draft.save();

    return draft;
}