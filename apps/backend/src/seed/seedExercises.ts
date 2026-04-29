import "dotenv/config";
import mongoose from "mongoose";
import Exercise from "../models/Exercises";
import { seededExercises } from "./exercises";

async function seedExercises() {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string, {
            dbName: process.env.DB_NAME,
        });

        await Exercise.deleteMany({
            isCustom: false,
            createdBy: null,
        });

        const insertedExercises = await Exercise.insertMany(seededExercises);

        console.log(`Seeded ${insertedExercises.length} exercises successfully.`);
    } catch (error) {
        console.error("Failed to seed exercises", error);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
}

seedExercises();