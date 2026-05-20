import "dotenv/config";
import mongoose from "mongoose";

import Exercise from "../models/Exercises";
import WorkoutTemplate from "../models/WorkoutTemplate";

type PlannedSetSeed = {
    reps: number | null;
    weight: number | null;
    restSeconds: number | null;
    notes?: string;
};

type TemplateExerciseSeed = {
    exerciseName: string;
    plannedSets: PlannedSetSeed[];
};

type WorkoutTemplateSeed = {
    name: string;
    description: string;
    category: "full_body" | "push" | "pull" | "legs" | "upper" | "lower";
    exercises: TemplateExerciseSeed[];
};

const templateSeeds: WorkoutTemplateSeed[] = [
    {
        name: "Full Body Foundation",
        description: "A balanced full-body workout covering legs, push, and pull.",
        category: "full_body",
        exercises: [
            {
                exerciseName: "Back Squat",
                plannedSets: [
                    { reps: 10, weight: null, restSeconds: 120 },
                    { reps: 8, weight: null, restSeconds: 120 },
                    { reps: 8, weight: null, restSeconds: 120 },
                ],
            },
            {
                exerciseName: "Bench Press",
                plannedSets: [
                    { reps: 10, weight: null, restSeconds: 120 },
                    { reps: 8, weight: null, restSeconds: 120 },
                    { reps: 8, weight: null, restSeconds: 120 },
                ],
            },
            {
                exerciseName: "Lat Pulldown",
                plannedSets: [
                    { reps: 12, weight: null, restSeconds: 90 },
                    { reps: 10, weight: null, restSeconds: 90 },
                    { reps: 10, weight: null, restSeconds: 90 },
                ],
            },
        ],
    },
    {
        name: "Push Day Starter",
        description: "Chest, shoulders, and triceps focused strength template.",
        category: "push",
        exercises: [
            {
                exerciseName: "Bench Press",
                plannedSets: [
                    { reps: 10, weight: null, restSeconds: 120 },
                    { reps: 8, weight: null, restSeconds: 120 },
                    { reps: 8, weight: null, restSeconds: 120 },
                ],
            },
            {
                exerciseName: "Arnold Press",
                plannedSets: [
                    { reps: 10, weight: null, restSeconds: 90 },
                    { reps: 10, weight: null, restSeconds: 90 },
                    { reps: 8, weight: null, restSeconds: 90 },
                ],
            },
            {
                exerciseName: "Tricep Pushdown",
                plannedSets: [
                    { reps: 12, weight: null, restSeconds: 60 },
                    { reps: 12, weight: null, restSeconds: 60 },
                    { reps: 10, weight: null, restSeconds: 60 },
                ],
            },
        ],
    },
    {
        name: "Pull Day Starter",
        description: "Back and biceps focused template for pulling strength.",
        category: "pull",
        exercises: [
            {
                exerciseName: "Lat Pulldown",
                plannedSets: [
                    { reps: 12, weight: null, restSeconds: 90 },
                    { reps: 10, weight: null, restSeconds: 90 },
                    { reps: 10, weight: null, restSeconds: 90 },
                ],
            },
            {
                exerciseName: "Seated Cable Row",
                plannedSets: [
                    { reps: 12, weight: null, restSeconds: 90 },
                    { reps: 10, weight: null, restSeconds: 90 },
                    { reps: 10, weight: null, restSeconds: 90 },
                ],
            },
            {
                exerciseName: "Dumbbell Curl",
                plannedSets: [
                    { reps: 12, weight: null, restSeconds: 60 },
                    { reps: 10, weight: null, restSeconds: 60 },
                    { reps: 10, weight: null, restSeconds: 60 },
                ],
            },
        ],
    },
    {
        name: "Leg Day Starter",
        description: "Quad, hamstring, glute, and calf focused leg workout.",
        category: "legs",
        exercises: [
            {
                exerciseName: "Back Squat",
                plannedSets: [
                    { reps: 10, weight: null, restSeconds: 120 },
                    { reps: 8, weight: null, restSeconds: 120 },
                    { reps: 8, weight: null, restSeconds: 120 },
                ],
            },
            {
                exerciseName: "Romanian Deadlift",
                plannedSets: [
                    { reps: 10, weight: null, restSeconds: 120 },
                    { reps: 10, weight: null, restSeconds: 120 },
                    { reps: 8, weight: null, restSeconds: 120 },
                ],
            },
            {
                exerciseName: "Standing Calf Raise",
                plannedSets: [
                    { reps: 15, weight: null, restSeconds: 60 },
                    { reps: 15, weight: null, restSeconds: 60 },
                    { reps: 12, weight: null, restSeconds: 60 },
                ],
            },
        ],
    },
    {
        name: "Upper Body Starter",
        description: "Upper body template with chest, back, shoulders, and arms.",
        category: "upper",
        exercises: [
            {
                exerciseName: "Bench Press",
                plannedSets: [
                    { reps: 10, weight: null, restSeconds: 120 },
                    { reps: 8, weight: null, restSeconds: 120 },
                    { reps: 8, weight: null, restSeconds: 120 },
                ],
            },
            {
                exerciseName: "Seated Cable Row",
                plannedSets: [
                    { reps: 12, weight: null, restSeconds: 90 },
                    { reps: 10, weight: null, restSeconds: 90 },
                    { reps: 10, weight: null, restSeconds: 90 },
                ],
            },
            {
                exerciseName: "Arnold Press",
                plannedSets: [
                    { reps: 10, weight: null, restSeconds: 90 },
                    { reps: 10, weight: null, restSeconds: 90 },
                    { reps: 8, weight: null, restSeconds: 90 },
                ],
            },
        ],
    },
    {
        name: "Lower Body Starter",
        description: "Lower body template focused on quads, glutes, hamstrings, and calves.",
        category: "lower",
        exercises: [
            {
                exerciseName: "Leg Press",
                plannedSets: [
                    { reps: 12, weight: null, restSeconds: 120 },
                    { reps: 10, weight: null, restSeconds: 120 },
                    { reps: 10, weight: null, restSeconds: 120 },
                ],
            },
            {
                exerciseName: "Romanian Deadlift",
                plannedSets: [
                    { reps: 10, weight: null, restSeconds: 120 },
                    { reps: 10, weight: null, restSeconds: 120 },
                    { reps: 8, weight: null, restSeconds: 120 },
                ],
            },
            {
                exerciseName: "Standing Calf Raise",
                plannedSets: [
                    { reps: 15, weight: null, restSeconds: 60 },
                    { reps: 15, weight: null, restSeconds: 60 },
                    { reps: 12, weight: null, restSeconds: 60 },
                ],
            },
        ],
    },
];

function escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function findPublicExerciseByName(name: string) {
    return Exercise.findOne({
        isCustom: false,
        createdBy: null,
        name: {
            $regex: new RegExp(`^${escapeRegex(name)}$`, "i"),
        },
    });
}

async function buildTemplateExercises(seedExercises: TemplateExerciseSeed[]) {
    const builtExercises = [];

    for (const [index, seedExercise] of seedExercises.entries()) {
        const exercise = await findPublicExerciseByName(seedExercise.exerciseName);

        if (!exercise) {
            throw new Error(
                `Could not find public exercise named "${seedExercise.exerciseName}". ` +
                "Update the seed file to use exercise names that exist in your database.",
            );
        }

        builtExercises.push({
            exercise: exercise._id,
            exerciseName: exercise.name,
            order: index,
            plannedSets: seedExercise.plannedSets,
        });
    }

    return builtExercises;
}

async function seedWorkoutTemplates() {
    const mongoUri = process.env.MONGODB_URI;
    const dbName = process.env.DB_NAME;

    if (!mongoUri) {
        throw new Error("MONGODB_URI is missing");
    }

    await mongoose.connect(mongoUri, {
        dbName,
    });

    console.log("Connected to MongoDB");

    for (const seed of templateSeeds) {
        const exercises = await buildTemplateExercises(seed.exercises);

        await WorkoutTemplate.findOneAndUpdate(
            {
                name: seed.name,
                isPublic: true,
                createdBy: null,
            },
            {
                name: seed.name,
                description: seed.description,
                category: seed.category,
                isPublic: true,
                createdBy: null,
                exercises,
            },
            {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true,
            },
        );

        console.log(`Seeded template: ${seed.name}`);
    }

    await mongoose.disconnect();

    console.log("Workout template seeding complete");
}

seedWorkoutTemplates().catch(async (error) => {
    console.error(error);

    await mongoose.disconnect();

    process.exit(1);
});