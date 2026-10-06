import Exercise from "../models/Exercises";
import WorkoutSession from "../models/WorkoutSession";
import { Types } from "mongoose";
import type { ExerciseSort } from "@workout-app/shared";
import { ValidationError } from "../errors/AppError";

export async function findPaginatedExercises(
    filter: Record<string, unknown>,
    page: number,
    limit: number,
    sort: ExerciseSort = "name",
    userId?: string,
) {
    const skip = (page - 1) * limit;
    if (sort === "mostUsed" && !userId) {
        throw new ValidationError("My most used requires an authenticated user");
    }

    const exercisesQuery = sort === "name"
        ? Exercise.find(filter).sort({ name: 1, _id: 1 }).skip(skip).limit(limit)
        : Exercise.aggregate([
            { $match: filter },
            {
                $lookup: {
                    from: WorkoutSession.collection.name,
                    localField: "_id",
                    foreignField: "exercises.exerciseId",
                    pipeline: [
                        { $match: {
                            deletedAt: null,
                            ...(sort === "mostUsed" ? { userId: new Types.ObjectId(userId) } : {}),
                        } },
                        // A session matches once even when it contains duplicate exercise entries.
                        { $count: "count" },
                    ],
                    as: "usage",
                },
            },
            { $set: { usageCount: { $ifNull: [{ $arrayElemAt: ["$usage.count", 0] }, 0] } } },
            { $sort: { usageCount: -1, name: 1, _id: 1 } },
            { $skip: skip },
            { $limit: limit },
            { $unset: ["usage", "usageCount"] },
        ]);

    const [exercises, total] = await Promise.all([
        exercisesQuery,
        Exercise.countDocuments(filter),
    ]);

    return {
        success: true,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
        exercises,
    };
}
