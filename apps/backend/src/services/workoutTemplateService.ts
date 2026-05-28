

import WorkoutTemplate from "../models/WorkoutTemplate";
import Exercise from "../models/Exercises";
import WorkoutDraft from "../models/WorkoutDraft";
import { Types } from "mongoose";

import { ForbiddenError, NotFoundError, ValidationError } from "../errors/AppError";
import { assertValidObjectId } from "../utils/assertValidObjectId";
import { findDuplicateIds } from "../utils/findDuplicateIds";

import type { CreateWorkoutTemplateInput, UpdateWorkoutTemplateInput, CreateWorkoutTemplateFromDraftInput } from "../schemas/workoutTemplateSchemas";
import type { Muscle } from "@workout-app/shared";

type PopulatedTemplateExercise = {
    _id: Types.ObjectId,
    primaryMuscles?: Muscle[];
    secondaryMuscles?: Muscle[];
}

async function buildTemplateExercises(
    inputExercises: CreateWorkoutTemplateInput["exercises"],
    userId: string,
) {
    const exerciseIds = inputExercises.map((item) => item.exerciseId);

    const dupliateIds = findDuplicateIds(exerciseIds);

    if (dupliateIds.length > 0) {
        throw new ValidationError("A template cannot contain duplicate exercises");
    }

    const availableExercises = await Exercise.find({
        _id: { $in: exerciseIds },

        $or: [
            { isCustom: false, createdBy: null },
            { createdBy: userId },
        ],
    });

    if (availableExercises.length !== exerciseIds.length) {
        throw new ValidationError("One or more exercises could not be found or are not available to you");
    }

    const exerciseMap = new Map(
        availableExercises.map((exercise) => [exercise.id, exercise]),
    );


    return inputExercises.map((inputExercise, index) => {
        const exercise = exerciseMap.get(inputExercise.exerciseId);

        if (!exercise) {
            throw new ValidationError("Exercise could not be found");
        }

        return {
            exercise: exercise._id,
            exerciseName: exercise.name,
            order: index,
            plannedSets: inputExercise.plannedSets ?? [],
        };
    });
}

export async function getPublicWorkoutTemplates() {
    const templates = await WorkoutTemplate.find({
        isPublic: true,
        createdBy: null,
    })
        .sort({ createdAt: -1 })
        .populate("exercises.exercise", "name primaryMuscles secondaryMuscles equipment difficulty exerciseType");

    return templates;
}

export async function getMyWorkoutTemplates(userId: string) {
    assertValidObjectId(userId, "user id");

    const templates = await WorkoutTemplate.find({
        isPublic: false,
        createdBy: userId,
    })
        .sort({ createdAt: -1 })
        .populate("exercises.exercise", "name primaryMuscles secondaryMuscles equipment difficulty exerciseType");

    return templates;
}


export async function getPublicWorkoutTemplateById(templateId: string) {
    assertValidObjectId(templateId, "template id");

    const template = await WorkoutTemplate.findOne({
        _id: templateId,
        isPublic: true,
        createdBy: null,
    }).populate(
        "exercises.exercise",
        "name primaryMuscles secondaryMuscles equipment difficulty exerciseType",
    );

    if (!template) {
        throw new NotFoundError("Workout template not found");
    }

    return template;
}

export async function getMyWorkoutTemplateById(
    templateId: string,
    userId: string,
) {
    assertValidObjectId(templateId, "template id");
    assertValidObjectId(userId, "user id");


    const template = await WorkoutTemplate.findOne({
        _id: templateId,
        isPublic: false,
        createdBy: userId,
    }).populate(
        "exercises.exercise",
        "name primaryMuscles secondaryMuscles equipment difficulty exerciseType",
    );

    if (!template) {
        throw new NotFoundError("Workout template not found");
    }

    return template;
}

export async function createWorkoutTemplate(
    input: CreateWorkoutTemplateInput,
    userId: string,
) {
    assertValidObjectId(userId, "user id");

    const exercises = await buildTemplateExercises(input.exercises, userId);

    const template = await WorkoutTemplate.create({
        name: input.name,
        description: input.description ?? "",
        category: input.category ?? "custom",

        isPublic: false,
        createdBy: userId,

        exercises,
    });

    return template;
}

export async function updateWorkoutTemplate(
    templateId: string,
    userId: string,
    input: UpdateWorkoutTemplateInput,
) {
    assertValidObjectId(templateId, "template id");
    assertValidObjectId(userId, "user id");

    const template = await WorkoutTemplate.findById(templateId);

    if (!template) {
        throw new NotFoundError("Workout template not found");
    }

    if (template.isPublic) {
        throw new ForbiddenError("Public templates cannot be edited");
    }

    if (!template.createdBy || template.createdBy.toString() !== userId) {
        throw new ForbiddenError("You can only edit your own templates");
    }

    if (input.name !== undefined) {
        template.name = input.name;
    }

    if (input.description !== undefined) {
        template.description = input.description;
    }

    if (input.category !== undefined) {
        template.category = input.category;
    }

    if (input.exercises !== undefined) {
        template.exercises = await buildTemplateExercises(
            input.exercises,
            userId,
        );
    }

    await template.save();

    return template;
}

export async function deleteWorkoutTemplate(
    templateId: string,
    userId: string,
) {
    assertValidObjectId(templateId, "template id");
    assertValidObjectId(userId, "user id");

    const template = await WorkoutTemplate.findById(templateId);

    if (!template) {
        throw new NotFoundError("Workout template not found");
    }

    if (template.isPublic) {
        throw new ForbiddenError("Public templates cannot be deleted");
    }

    if (!template.createdBy || template.createdBy.toString() !== userId) {
        throw new ForbiddenError("You can only delete your own templates");
    }

    await WorkoutTemplate.findByIdAndDelete(templateId);

    return {
        message: "Workout template deleted successfully",
        deletedTemplateId: templateId,
    };
}

export async function startWorkoutFromTemplate(
    templateId: string,
    userId: string,
) {
    assertValidObjectId(templateId, "template id");
    assertValidObjectId(userId, "user id");

    const template = await WorkoutTemplate.findById(templateId).populate(
        "exercises.exercise",
        "name primaryMuscles secondaryMuscles equipment difficulty exerciseType",
    );

    if (!template) {
        throw new NotFoundError("Workout template not found");
    }

    const isOwner =
        template.createdBy && template.createdBy.toString() === userId;

    const canUseTemplate = template.isPublic || isOwner;

    if (!canUseTemplate) {
        throw new ForbiddenError("You are not allowed to use this template");
    }

    if (template.exercises.length === 0) {
        throw new ValidationError("Cannot start workout from an empty template");
    }

    const validTemplateExercises = template.exercises.filter(
        (templateExercise) => templateExercise.exercise,
    );

    if (validTemplateExercises.length === 0) {
        throw new ValidationError(
            "Cannot start workout because this template has no available exercises.",
        );
    }

    const selectedMuscleGroups = new Set<Muscle>();

    for (const templateExercise of validTemplateExercises) {
        const exercise =
            templateExercise.exercise as unknown as PopulatedTemplateExercise;

        for (const muscle of exercise.primaryMuscles ?? []) {
            selectedMuscleGroups.add(muscle);
        }
    }

    const draftExercises = [...validTemplateExercises]
        .sort((a, b) => a.order - b.order)
        .map((templateExercise) => {
            const exercise =
                templateExercise.exercise as unknown as PopulatedTemplateExercise;

            return {
                exerciseId: exercise._id,
                exerciseName: templateExercise.exerciseName,
                sets: templateExercise.plannedSets.map((set) => ({
                    weight: set.weight ?? null,
                    reps: set.reps ?? null,
                })),
            };
        });

    const draft = await WorkoutDraft.create({
        userId,
        status: "building",
        purpose: "workout",
        selectedMuscleGroups: Array.from(selectedMuscleGroups),
        exercises: draftExercises,
        sourceTemplateId: template._id,
    });

    return draft;
}

export async function createWorkoutTemplateFromDraft(
    draftId: string,
    userId: string,
    input: CreateWorkoutTemplateFromDraftInput,
) {
    assertValidObjectId(draftId, "draft id");
    assertValidObjectId(userId, "user id");

    const draft = await WorkoutDraft.findOne({
        _id: draftId,
        userId,
        purpose: "template",
        status: "building",
    });

    if (!draft) {
        throw new NotFoundError("Template draft could not be found");
    }

    if (draft.exercises.length === 0) {
        throw new ValidationError("Cannot create a template without exercises");
    }

    const templateExercises = draft.exercises.map((draftExercise, index) => ({
        exercise: draftExercise.exerciseId,
        exerciseName: draftExercise.exerciseName,
        order: index,
        plannedSets: draftExercise.sets.map((set) => ({
            reps: set.reps,
            weight: set.weight,
            restSeconds: null,
            notes: "",
        })),
    }));

    const template = await WorkoutTemplate.create({
        name: input.name,
        description: input.description ?? "",
        category: input.category ?? "custom",
        isPublic: false,
        createdBy: userId,
        exercises: templateExercises,
    });

    draft.status = "abandoned";
    await draft.save();

    return template;
}

export async function createTemplateEditDraft(
    templateId: string,
    userId: string,
) {
    assertValidObjectId(templateId, "template id");
    assertValidObjectId(userId, "user id");

    const template = await WorkoutTemplate.findOne({
        _id: templateId,
        isPublic: false,
        createdBy: userId,
    }).populate(
        "exercises.exercise", "name primaryMuscles secondaryMuscles equipment difficulty exerciseType",
    );

    if (!template) {
        throw new NotFoundError("Workout template not found");
    }

    if (template.exercises.length === 0) {
        throw new ValidationError("Cannot edit an empty template");
    }

    const selectedMuscleGroups = new Set<Muscle>();


    const draftExercises = [...template.exercises]
        .sort((a, b) => a.order - b.order)
        .map((templateExercise) => {
            const exercise =
                templateExercise.exercise as unknown as PopulatedTemplateExercise | null;

            if (!exercise) {
                throw new ValidationError(
                    `Cannot edit template because an exercise is missing: ${templateExercise.exerciseName}`,
                );
            }

            for (const muscle of exercise.primaryMuscles ?? []) {
                selectedMuscleGroups.add(muscle);
            }

            return {
                exerciseId: exercise._id,
                exerciseName: templateExercise.exerciseName,
                sets: templateExercise.plannedSets.map((set) => ({
                    weight: set.weight ?? null,
                    reps: set.reps ?? null,
                })),
            };
        });

    const draft = await WorkoutDraft.create({
        userId,
        status: "building",
        purpose: "template",
        selectedMuscleGroups: Array.from(selectedMuscleGroups),
        exercises: draftExercises,
        sourceTemplateId: template._id,
    });

    return draft;
}