import type { ExtendedBodyPart, Slug } from "@mjcdev/react-body-highlighter";

const neutralBodyParts: Slug[] = ["abs", "adductors", "ankles", "biceps", "calves", "chest", "deltoids", "feet", "forearm", "gluteal", "hamstring", "hands", "hair", "head", "knees", "lower-back", "neck", "obliques", "quadriceps", "tibialis", "trapezius", "triceps", "upper-back"];

const muscleToBodyPartSlugs: Record<string, Slug[]> = {
    chest: ["chest"],
    back: ["upper-back", "lower-back"],
    shoulders: ["deltoids"],
    biceps: ["biceps"],
    triceps: ["triceps"],
    quads: ["quadriceps"],
    hamstrings: ["hamstring"],
    glutes: ["gluteal"],
    calves: ["calves"],
    core: ["abs"],
    forearms: ["forearm"],
};

function normalizeMuscle(muscle: string) {
    return muscle.trim().toLowerCase();
}

export function mapMusclesToBodyHighlighterData(
    primaryMuscles: string[],
    secondaryMuscles: string[],
): ExtendedBodyPart[] {
    const bodyPartMap = new Map<Slug, 1 | 2 | 3>(
        neutralBodyParts.map(slug => [slug, 3]),
    );

    for (const muscle of secondaryMuscles) {
        const normalizedMuscle = normalizeMuscle(muscle);
        const slugs = muscleToBodyPartSlugs[normalizedMuscle] ?? [];

        for (const slug of slugs) {
            bodyPartMap.set(slug, 1);
        }
    }

    for (const muscle of primaryMuscles) {
        const normalizedMuscle = normalizeMuscle(muscle);
        const slugs = muscleToBodyPartSlugs[normalizedMuscle] ?? [];

        for (const slug of slugs) {
            bodyPartMap.set(slug, 2);
        }
    }

    return [...bodyPartMap.entries()].map(([slug, intensity]) => ({
        slug,
        intensity,
    }));
}
