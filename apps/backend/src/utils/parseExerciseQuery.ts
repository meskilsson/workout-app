import { Request } from "express";
import { ValidationError } from "../errors/AppError";

export function parseExerciseQuery(req: Request) {
    let limit = Number(req.query.limit);
    let page = Number(req.query.page);
    const rawSearch = req.query.search;

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

    return {
        page,
        limit,
        search,
    };
}