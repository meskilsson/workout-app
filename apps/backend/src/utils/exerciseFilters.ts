import type { Muscle } from "@workout-app/shared";
import { muscleSearchAliases } from "@workout-app/shared";
import { escapeRegex } from "./escapeRegex";
import { swedishExercises } from "../localization/exercises";


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

    const translatedNames = [...swedishExercises].filter(([, translation]) =>
        [translation.name, translation.description, translation.instructions]
            .some(text => text.toLocaleLowerCase("sv-SE").includes(normalizedSearch)),
    ).map(([name]) => name);
    if (translatedNames.length) searchFilters.push({
        isCustom: false, createdBy: null, name: { $in: translatedNames },
    });

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

export function buildMuscleFilter(muscles: Muscle[], includeCardio = true) {
    return {
        $or: [
            ...(includeCardio ? [{ exerciseType: "cardio" }] : []),
            { primaryMuscles: { $in: muscles } },
            { secondaryMuscles: { $in: muscles } },
        ],
    };
}
