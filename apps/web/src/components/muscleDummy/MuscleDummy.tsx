import BodyHighlighter from "@mjcdev/react-body-highlighter";
import { useId } from "react";
import { mapMusclesToBodyHighlighterData } from "../../utils/muscleProfile";
import type { BodyModelGender } from "@workout-app/shared";
import { useBodyModel } from "../../context/BodyModelContext";
import styles from "./MuscleDummy.module.css";

type MuscleDummyProps = {
    primaryMuscles?: string[];
    secondaryMuscles?: string[];
    variant?: "full" | "mini";
    gender?: BodyModelGender;
};



export default function MuscleDummy({
    primaryMuscles = [],
    secondaryMuscles = [],
    variant = "full",
    gender,
}: MuscleDummyProps) {
    const descriptionId = useId();
    const { gender: selectedGender } = useBodyModel();

    const bodyGender = gender ?? selectedGender;

    const data = mapMusclesToBodyHighlighterData(
        primaryMuscles,
        secondaryMuscles,
    );

    const highlightColors = [
        "var(--color-dummy-muscle-secondary)",
        "var(--color-dummy-muscle-primary)",
        "var(--color-dummy-muscle-neutral)",
    ];

    return (
        <figure
            aria-labelledby={descriptionId}
            className={`${styles.wrapper} ${variant === "mini" ? styles.mini : styles.full
                }`}
        >
            <div className={styles.bodyViews} aria-hidden="true">
                <div className={styles.bodyView}>
                    <span className={styles.bodyLabel}>Front</span>

                    <BodyHighlighter
                        data={data}
                        side="front"
                        gender={bodyGender}
                        colors={highlightColors}
                    />
                </div>

                <div className={styles.bodyView}>
                    <span className={styles.bodyLabel}>Back</span>

                    <BodyHighlighter
                        data={data}
                        side="back"
                        gender={bodyGender}
                        colors={highlightColors}
                    />
                </div>
            </div>
            <figcaption id={descriptionId} className={styles.caption}>
                <span className={styles.legendTitle}>Muscle profile</span>
                <div className={styles.legend}>
                    <span><i className={styles.primarySwatch} aria-hidden="true" />Primary</span>
                    <span><i className={styles.secondarySwatch} aria-hidden="true" />Secondary</span>
                    <span><i className={styles.neutralSwatch} aria-hidden="true" />Untargeted</span>
                </div>
                <p><strong>Primary:</strong> {primaryMuscles.join(", ") || "None"}</p>
                <p><strong>Secondary:</strong> {secondaryMuscles.filter(muscle => !primaryMuscles.some(primary => primary.trim().toLowerCase() === muscle.trim().toLowerCase())).join(", ") || "None"}</p>
            </figcaption>
        </figure>
    );
}
