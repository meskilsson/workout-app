import { validateTraining, validateCardioCompletion } from "@workout-app/shared";
import { randomUUID } from "node:crypto";
import { Types } from "mongoose";
import { MUSCLE_OPTIONS, type Muscle } from "@workout-app/shared";
import Exercise from "../models/Exercises";
import WorkoutDraft from "../models/WorkoutDraft";
import { createWorkoutSession } from "./workoutSessionService";
import { ConflictError, NotFoundError, ValidationError } from "../errors/AppError";
import type { WorkoutDraftStatus, WorkoutDraftPurpose } from "../models/WorkoutDraft";
import { lastExerciseSets } from "./exerciseHistoryService";

interface CreateWorkoutDraftInput {
    includeCardio?: unknown;
    selectedMuscleGroups?: unknown;
    purpose?: unknown;
}

interface UpdateMuscleGroupsInput {
    selectedMuscleGroups?: unknown;
}

interface UpdateExercisesInput {
    exerciseIds?: unknown;
}

interface WorkoutDraftSetInput {
    isWarmup?: boolean;
    id?: string;
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

const editableStatuses = ["building", "active"] as const;
const muscleOptionSet = new Set<string>(MUSCLE_OPTIONS);

function isEditableStatus(
    status: WorkoutDraftStatus,
): status is (typeof editableStatuses)[number] {
    return editableStatuses.includes(
        status as (typeof editableStatuses)[number],
    );
}

function normalizeDraftPurpose(value: unknown): WorkoutDraftPurpose {
    if (value === undefined || value === null || value === "") {
        return "workout";
    }

    if (value !== "workout" && value !== "template") {
        throw new ValidationError("Invalid workout draft purpose");
    }

    return value;
}

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
            id: draftSet.id ?? randomUUID(),
            ...(draftSet.isWarmup !== undefined ? { isWarmup: draftSet.isWarmup } : {}),
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

    const purpose = normalizeDraftPurpose(draftData.purpose);
    if (draftData.includeCardio !== undefined && typeof draftData.includeCardio !== "boolean") throw new ValidationError("includeCardio must be a boolean");

    await WorkoutDraft.updateMany(
        {
            userId,
            purpose,
            status: { $in: editableStatuses },
        },
        {
            $set: { status: "abandoned" },
        },
    );

    const draft = await WorkoutDraft.create({
        userId,
        status: "building",
        purpose,
        selectedMuscleGroups,
        includeCardio: draftData.includeCardio,
        exercises: [],
        startedAt: null,
        completedSessionId: null,
    });

    return draft;
}

export async function getCurrentWorkoutDraft(userId: string) {
    const draft = await WorkoutDraft.findOne({
        userId,
        purpose: "workout",
        status: { $in: editableStatuses },
    }).sort({ updatedAt: -1 });

    return draft;
}

export async function getWorkoutDraftById(draftId: string, userId: string) {
    const draft = await getOwnedDraft(draftId, userId);
    let migrated = false;
    // Assign identities to legacy sets once, without overwriting concurrent edits.
    for (const [exerciseIndex, exercise] of draft.exercises.entries()) {
        for (const [setIndex, set] of exercise.sets.entries()) {
            if (set.id) continue;
            migrated = true;
            const path = `exercises.${exerciseIndex}.sets.${setIndex}.id`;
            await WorkoutDraft.updateOne(
                { _id: draft._id, userId, [path]: { $exists: false },
                    [`exercises.${exerciseIndex}.exerciseId`]: exercise.exerciseId,
                    [`exercises.${exerciseIndex}.sets.${setIndex}`]: { $exists: true } },
                { $set: { [path]: randomUUID() } },
                { timestamps: false },
            );
        }
    }
    return migrated ? getOwnedDraft(draftId, userId) : draft;
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

    const existingSupersets = new Map(draft.exercises.map(e => [e.exerciseId.toString(), e.supersetId]));
    const existingTraining = new Map(draft.exercises.map(e => [e.exerciseId.toString(), e.training]));
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
    const previousSets = draft.purpose === "template" ? new Map() : await lastExerciseSets(userId,
        exercises.filter(exercise => exercise.exerciseType !== "cardio" && !existingSetsByExerciseId.has(exercise._id.toString())).map(exercise => exercise._id.toString()));

    draft.exercises = exerciseIds.map((exerciseId) => {
        const exercise = exercisesById.get(exerciseId);

        if (!exercise) {
            throw new ValidationError("Exercise not found");
        }

        if (selectedMuscleGroups.length > 0 && exercise.exerciseType !== "cardio" && !exerciseMatchesSelectedMuscle(exercise, selectedMuscleGroups)) {
            throw new ValidationError(
                `${exercise.name} does not match your selected muscle groups`,
            );
        }

        return {
            exerciseId: exercise._id as Types.ObjectId,
            exerciseName: exercise.name,
            sets: existingSetsByExerciseId.get(exerciseId) ?? previousSets.get(exerciseId) ?? [],
            supersetId: existingSupersets.get(exerciseId),
            training: existingTraining.has(exerciseId) ? existingTraining.get(exerciseId) : (exercise.exerciseType === "cardio" ? { format: "cardio", durationSeconds: 600 } : undefined),
        };
    });

    await draft.save();

    return draft;
}

export async function addWorkoutDraftExercises(
    draftId: string,
    exerciseData: UpdateExercisesInput,
    userId: string,
) {
    const draft = await getOwnedDraft(draftId, userId);

    ensureDraftIsActive(draft.status);

    const exerciseIds = normalizeExerciseIds(exerciseData.exerciseIds);

    const existingExerciseIdSet = new Set(
        draft.exercises.map((exercise) => exercise.exerciseId.toString()),
    );

    const newExerciseIds = exerciseIds.filter(
        (exerciseId) => !existingExerciseIdSet.has(exerciseId),
    );

    if (newExerciseIds.length === 0) {
        return draft;
    }

    const exercises = await Exercise.find({
        _id: { $in: newExerciseIds },
        $or: [{ isCustom: false, createdBy: null }, { createdBy: userId }],
    });

    if (exercises.length !== newExerciseIds.length) {
        throw new ValidationError(
            "One or more exercises were not found or are not available to you",
        );
    }

    const exerciseById = new Map(
        exercises.map((exercise) => [
            (exercise._id as Types.ObjectId).toString(),
            exercise,
        ]),
    );

    const previousSets = await lastExerciseSets(userId, exercises.filter(exercise => exercise.exerciseType !== "cardio").map(exercise => exercise._id.toString()));
    const exercisesToAdd = newExerciseIds.map((exerciseId) => {
        const exercise = exerciseById.get(exerciseId);

        if (!exercise) {
            throw new ValidationError("Exercise not found");
        }

        return {
            exerciseId: exercise._id as Types.ObjectId,
            exerciseName: exercise.name,
            sets: previousSets.get(exerciseId) ?? [],
            training: exercise.exerciseType === "cardio" ? { format: "cardio" as const, durationSeconds: 600 } : undefined,
        };
    });

    draft.exercises.push(...exercisesToAdd);

    await draft.save();

    return draft;

}

export async function replaceWorkoutDraftExercise(draftId: string, exerciseId: string, replacementId: string, userId: string) {
    const draft = await getOwnedDraft(draftId, userId);
    ensureDraftIsActive(draft.status);
    const oldId = normalizeObjectId(exerciseId, "exercise id").toString();
    const nextId = normalizeObjectId(replacementId, "replacement exercise id").toString();
    const index = draft.exercises.findIndex(exercise => exercise.exerciseId.toString() === oldId);
    if (index < 0) throw new NotFoundError("Exercise is not part of this draft");
    if (draft.exercises.some(exercise => exercise.exerciseId.toString() === nextId)) throw new ValidationError("Exercise is already in this workout");
    const exercise = await Exercise.findOne({ _id: nextId, $or: [{ isCustom: false, createdBy: null }, { createdBy: userId }] });
    if (!exercise) throw new NotFoundError("Exercise is not available to you");
    const cardio = exercise.exerciseType === "cardio";
    const sets = cardio ? [] : (await lastExerciseSets(userId, [nextId])).get(nextId) ?? [];
    const group = draft.exercises[index]!.supersetId;
    const replacement = { exerciseId: exercise._id, exerciseName: exercise.name, sets,
        ...(cardio ? { training: { format: "cardio", durationSeconds: 600 } } : group ? { supersetId: group } : {}) };
    const unset: Record<string, 1> = {};
    if (cardio && group) draft.exercises.forEach((entry, i) => { if (i !== index && entry.supersetId === group) unset[`exercises.${i}.supersetId`] = 1; });
    const result = await WorkoutDraft.findOneAndUpdate({ _id: draft._id, userId, status: "active",
        $expr: { $eq: [{ $map: { input: "$exercises", as: "exercise", in: "$$exercise.exerciseId" } }, draft.exercises.map(entry => entry.exerciseId)] } },
    { $set: { [`exercises.${index}`]: replacement }, ...(Object.keys(unset).length ? { $unset: unset } : {}) }, { returnDocument: "after", runValidators: true });
    if (!result) throw new ConflictError("Workout changed; reload before saving");
    return result;
}

export async function removeWorkoutDraftExercise(
    draftId: string,
    exerciseId: string,
    userId: string,
) {
    const draft = await getOwnedDraft(draftId, userId);

    ensureDraftIsActive(draft.status);

    const exerciseObjectId = normalizeObjectId(exerciseId, "exercise id");

    const exerciseIndex = draft.exercises.findIndex(
        (exercise) =>
            exercise.exerciseId.toString() === exerciseObjectId.toString(),
    );

    if (exerciseIndex === -1) {
        throw new NotFoundError("Exercise is not part of this draft");
    }

    if (draft.exercises.length === 1) {
        throw new ConflictError(
            "Add another exercise before removing the final exercise",
        );
    }

    const removedGroup = draft.exercises[exerciseIndex].supersetId;
    draft.exercises.splice(exerciseIndex, 1);
    if (removedGroup) draft.exercises.forEach(exercise => { if (exercise.supersetId === removedGroup) exercise.supersetId = undefined; });

    await draft.save();

    return draft;
}


export async function startWorkoutDraft(draftId: string, userId: string) {
    const draft = await WorkoutDraft.findOne({
        _id: draftId,
        userId,
    });

    if (!draft) {
        throw new NotFoundError("Workout draft not found");
    }

    if (draft.purpose !== "workout") {
        throw new ConflictError("Template drafts cannot be started as workouts");
    }

    if (draft.status !== "building") {
        throw new ConflictError("Only building workout drafts can be started");
    }

    draft.status = "active";
    draft.startedAt = new Date();

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
            exercises: { $elemMatch: { exerciseId: exerciseObjectId, "training.format": { $nin: ["cardio", "intervals"] } } },
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
        if (exercise.training && exercise.training.format !== "strength") {
            if (!exercise.cardioCompletion) throw new ValidationError(`Complete cardio for ${exercise.exerciseName} before ending the workout`);
            return { exerciseId: exercise.exerciseId.toString(), exerciseName: exercise.exerciseName, sets: [], training: exercise.training, cardioCompletion: exercise.cardioCompletion };
        }
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
            ...(exercise.supersetId ? { supersetId: exercise.supersetId } : {}),
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

export async function reorderWorkoutDraftExercises(
    draftId: string,
    reorderData: UpdateExercisesInput,
    userId: string,
) {
    const draft = await getOwnedDraft(draftId, userId);

    if (!isEditableStatus(draft.status)) {
        throw new ConflictError("This draft cannot be reordered");
    }

    const exerciseIds = normalizeExerciseIds(reorderData.exerciseIds);

    const currentExerciseIds = draft.exercises.map((exercise) =>
        exercise.exerciseId.toString(),
    );

    if (exerciseIds.length !== currentExerciseIds.length) {
        throw new ValidationError("Reordered exercises must contain the same exercises");
    }

    const currentExerciseIdSet = new Set(currentExerciseIds);

    const hasSameExercises = exerciseIds.every((exerciseId) =>
        currentExerciseIdSet.has(exerciseId),
    );

    if (!hasSameExercises) {
        throw new ValidationError("Reordered exercises must contain the same exercises");
    }

    const exerciseById = new Map(
        draft.exercises.map((exercise) => [
            exercise.exerciseId.toString(),
            exercise,
        ]),
    );

    draft.exercises = exerciseIds.map((exerciseId) => {
        const exercise = exerciseById.get(exerciseId);

        if (!exercise) {
            throw new ValidationError("Exercise is not part of this draft");
        }

        return exercise;
    });

    await draft.save();

    return draft;

}
export async function updateWorkoutDraftTraining(draftId: string, input: { exerciseId: string; training: unknown; cardioCompletion?: unknown }, userId: string) {
    const draft = await getOwnedDraft(draftId, userId);
    if (!isEditableStatus(draft.status)) throw new ConflictError("This workout cannot be edited");
    const id = normalizeObjectId(input.exerciseId, "exercise id");
    const exercise = draft.exercises.find(e => e.exerciseId.toString() === id.toString());
    if (!exercise) throw new NotFoundError("Exercise is not part of this draft");
    let training, completion;
    try {
        training = validateTraining(input.training);
        if (input.cardioCompletion !== undefined) {
            ensureDraftIsActive(draft.status);
            completion = validateCardioCompletion(input.cardioCompletion, training);
        }
    } catch (error) { throw new ValidationError(error instanceof Error ? error.message : "Invalid training"); }
    const changed = JSON.stringify(exercise.training ?? { format: "strength" }) !== JSON.stringify(training);
    const updated = await WorkoutDraft.findOneAndUpdate({ _id: draft._id, userId, status: draft.status, "exercises.exerciseId": id },
        { $set: { "exercises.$.training": training,
            ...(completion ? { "exercises.$.cardioCompletion": completion } : {}),
            ...(changed && training.format !== "strength" ? { "exercises.$.sets": [] } : {}) },
            ...(!completion ? { $unset: { "exercises.$.cardioCompletion": 1 } } : {}) }, { returnDocument: "after", runValidators: true });
    if (!updated) throw new ConflictError("Workout changed; reload before saving");
    return updated;
}

export async function updateWorkoutSupersets(draftId: string, pairs: [string, string][], userId: string) {
    const draft = await getOwnedDraft(draftId, userId);
    ensureDraftIsActive(draft.status);
    const used = new Set<string>();
    const groups = new Map<string, string>();
    for (const pair of pairs) {
        const groupId = randomUUID();
        for (const id of pair) {
            const exercise = draft.exercises.find(item => item.exerciseId.toString() === id);
            if (used.has(id) || !exercise || (exercise.training && exercise.training.format !== "strength")) {
                throw new ValidationError("Supersets must contain two distinct strength exercises from this workout");
            }
            used.add(id);
            groups.set(id, groupId);
        }
    }
    const updates: Record<string, unknown> = {};
    const unset: Record<string, 1> = {};
    draft.exercises.forEach((exercise, index) => {
        const group = groups.get(exercise.exerciseId.toString());
        if (group) updates[`exercises.${index}.supersetId`] = group;
        else unset[`exercises.${index}.supersetId`] = 1;
    });
    // Compare the exercise order to avoid applying index updates after a concurrent reorder/removal.
    const result = await WorkoutDraft.findOneAndUpdate({ _id: draft._id, userId, status: "active",
        $expr: { $eq: [{ $map: { input: "$exercises", as: "exercise", in: "$$exercise.exerciseId" } }, draft.exercises.map(exercise => exercise.exerciseId)] },
    }, { ...(Object.keys(updates).length ? { $set: updates } : {}), ...(Object.keys(unset).length ? { $unset: unset } : {}) }, { new: true });
    if (!result) throw new ValidationError("The workout changed. Please try again");
    return result;
}
