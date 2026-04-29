import type { Muscle } from "./muscles";

export const DUMMY_REGION_OPTIONS = [
    "chest",
    "upperBack",
    "lats",
    "frontShoulders",
    "rearShoulders",
    "biceps",
    "triceps",
    "forearms",
    "core",
    "frontQuads",
    "hamstrings",
    "glutes",
    "calves",
] as const;

export type DummyRegion = (typeof DUMMY_REGION_OPTIONS)[number];

export const MUSCLE_TO_DUMMY_REGIONS: Record<Muscle, DummyRegion[]> = {
    chest: ["chest"],

    back: ["upperBack", "lats"],

    shoulders: ["frontShoulders", "rearShoulders"],

    biceps: ["biceps"],

    triceps: ["triceps"],

    quads: ["frontQuads"],

    hamstrings: ["hamstrings"],

    glutes: ["glutes"],

    calves: ["calves"],

    core: ["core"],

    forearms: ["forearms"],
};

export function mapMusclesToDummyRegions(muscles: string[] = []): DummyRegion[] {
    const regions = new Set<DummyRegion>();

    for (const muscle of muscles) {
        const normalizedMuscle = muscle.trim().toLowerCase() as Muscle;
        const mappedRegions = MUSCLE_TO_DUMMY_REGIONS[normalizedMuscle];

        if (!mappedRegions) {
            continue;
        }

        for (const region of mappedRegions) {
            regions.add(region);
        }
    }

    return [...regions];
}