import { Request } from "express";
import {
    MUSCLE_OPTIONS,
    muscleSearchAliases,
    type Muscle,
} from "@workout-app/shared";

import { ValidationError } from "../errors/AppError";

export type ExerciseQueryOptions = {
    page: number;
    limit: number;
    search?: string;
    muscles?: Muscle[];
};

function parseStringList(value: unknown, fieldName: string): string[] {
    if (value === undefined) {
        return [];
    }

    if (typeof value === "string") {
        return value
            .split(",")
            .map((item) => item.trim().toLowerCase())
            .filter(Boolean);
    }

    if (Array.isArray(value)) {
        return value.flatMap((item) => {
            if (typeof item !== "string") {
                throw new ValidationError(`${fieldName} must be a string`);
            }

            return item
                .split(",")
                .map((part) => part.trim().toLowerCase())
                .filter(Boolean);
        });
    }

    throw new ValidationError(`${fieldName} must be a string`);
}

function normalizeMuscles(rawMuscles: string[]): Muscle[] {
    const validMuscles = new Set<string>(MUSCLE_OPTIONS);

    const expandedMuscles = rawMuscles.flatMap((muscle) => {
        const aliasMuscles = muscleSearchAliases[muscle] ?? [];

        return [muscle, ...aliasMuscles];
    });

    const normalizedMuscles = expandedMuscles.filter((muscle) =>
        validMuscles.has(muscle),
    ) as Muscle[];

    return Array.from(new Set(normalizedMuscles));
}

export function parseExerciseQuery(req: Request): ExerciseQueryOptions {
    let limit = Number(req.query.limit);
    let page = Number(req.query.page);

    const rawSearch = req.query.search;
    const rawMuscles = parseStringList(req.query.muscles, "Muscles");

    let search: string | undefined;

    if (Number.isNaN(limit) || limit < 1) {
        limit = 10;
    }

    if (limit > 100) {
        limit = 100;
    }

    if (Number.isNaN(page) || page < 1) {
        page = 1;
    }

    if (rawSearch !== undefined) {
        if (typeof rawSearch !== "string") {
            throw new ValidationError("Search must be a string");
        }

        const trimmedSearch = rawSearch.trim();

        if (trimmedSearch.length > 0) {
            search = trimmedSearch;
        }
    }

    const muscles = normalizeMuscles(rawMuscles);

    return {
        page,
        limit,
        search,
        ...(muscles.length > 0 ? { muscles } : {}),
    };
}