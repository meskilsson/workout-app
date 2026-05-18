import Exercise from "../models/Exercises";

export async function findPaginatedExercises(
    filter: Record<string, unknown>,
    page: number,
    limit: number,
) {
    const skip = (page - 1) * limit;

    const [exercises, total] = await Promise.all([
        Exercise.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
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