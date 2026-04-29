import BodyHighlighter, {
    type ExtendedBodyPart,
    type Slug,
} from "@mjcdev/react-body-highlighter";
import styles from "./MuscleDummy.module.css";

type MuscleDummyProps = {
    primaryMuscles?: string[];
    secondaryMuscles?: string[];
    variant?: "full" | "mini";
};

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

function mapMusclesToBodyHighlighterData(
    primaryMuscles: string[],
    secondaryMuscles: string[],
): ExtendedBodyPart[] {
    const bodyPartMap = new Map<Slug, 1 | 2>();

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

export default function MuscleDummy({
    primaryMuscles = [],
    secondaryMuscles = [],
    variant = "full",
}: MuscleDummyProps) {
    const data = mapMusclesToBodyHighlighterData(
        primaryMuscles,
        secondaryMuscles,
    );

    return (
        <div
            className={`${styles.wrapper} ${variant === "mini" ? styles.mini : styles.full
                }`}
        >
            <BodyHighlighter data={data} />
        </div>
    );
}