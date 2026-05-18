import type { Muscle } from "@workout-app/shared";
import { muscleSearchAliases } from "@workout-app/shared";
import { escapeRegex } from "./escapeRegex";


export function buildSearchFilter(search: string) {

    const normalizedSearch = search.trim().toLowerCase();

    const searchRegex = new RegExp(escapeRegex(normalizedSearch), "i");

    const aliasMuscles = muscleSearchAliases[normalizedSearch] ?? [];

    const searchFilters: Record<string, unknown>[] = [
        { name: searchRegex },
        { description: searchRegex },
        { instructions: searchRegex },
        { exerciseType: searchRegex },
        { equipment: searchRegex },
        { difficulty: searchRegex },
        { primaryMuscles: searchRegex },
        { secondaryMuscles: searchRegex },
    ];

    if (aliasMuscles.length > 0) {
        searchFilters.push(
            { primaryMuscles: { $in: aliasMuscles } },
            { secondaryMuscles: { $in: aliasMuscles } },
        );
    }

    return {
        $or: searchFilters,
    };
}

export function buildMuscleFilter(muscles: Muscle[]) {
    return {
        $or: [
            { primaryMuscles: { $in: muscles } },
            { secondaryMuscles: { $in: muscles } },
        ],
    };
}
