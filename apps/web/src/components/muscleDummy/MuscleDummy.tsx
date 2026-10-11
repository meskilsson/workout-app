import { displayValue, t } from "../../i18n";
import { useTranslation } from "react-i18next";
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
    useTranslation();
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
                    <span className={styles.bodyLabel}>{t("MuscleDummy.front")}</span>

                    <BodyHighlighter
                        data={data}
                        side="front"
                        gender={bodyGender}
                        colors={highlightColors}
                    />
                </div>

                <div className={styles.bodyView}>
                    <span className={styles.bodyLabel}>{t("common.back")}</span>

                    <BodyHighlighter
                        data={data}
                        side="back"
                        gender={bodyGender}
                        colors={highlightColors}
                    />
                </div>
            </div>
            <figcaption id={descriptionId} className={styles.caption}>
                <span className={styles.legendTitle}>{t("MuscleDummy.muscleProfile")}</span>
                <div className={styles.legend}>
                    <span><i className={styles.primarySwatch} aria-hidden="true" />{t("common.primary")}</span>
                    <span><i className={styles.secondarySwatch} aria-hidden="true" />{t("common.secondary")}</span>
                    <span><i className={styles.neutralSwatch} aria-hidden="true" />{t("MuscleDummy.untargeted")}</span>
                </div>
                <p><strong>{t("MuscleDummy.primary")}</strong> {primaryMuscles.map(displayValue).join(", ") || t("common.none")}</p>
                <p><strong>{t("MuscleDummy.secondary")}</strong> {secondaryMuscles.filter(muscle => !primaryMuscles.some(primary => primary.trim().toLowerCase() === muscle.trim().toLowerCase())).map(displayValue).join(", ") || t("common.none")}</p>
            </figcaption>
        </figure>
    );
}
