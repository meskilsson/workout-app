import "dotenv/config";
import mongoose from "mongoose";
import Exercise from "../models/Exercises";
import { seededExercises } from "./seededExercises.expanded";

async function seedExercises() {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string, {
            dbName: process.env.DB_NAME,
        });

        let seededCount = 0;

        for (const exercise of seededExercises) {
            await Exercise.updateOne(
                {
                    name: exercise.name,
                    isCustom: false,
                    createdBy: null,
                },
                {
                    $set: exercise,
                },
                {
                    upsert: true,
                },
            );

            seededCount += 1;
        }

        console.log(`Seeded or updated ${seededCount} exercises successfully.`);
    } catch (error) {
        console.error("Failed to seed exercises", error);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
}

seedExercises();