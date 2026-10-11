import { useTranslation } from "react-i18next";
import { t } from "../../i18n";
import { useReducedMotion } from "../motion/useReducedMotion";
import { motion } from "motion/react";
import type { CSSProperties } from "react";

import styles from "./LoadingPredator.module.css";

type LoadingPredatorSize = "small" | "medium" | "large";

type LoadingPredatorProps = {
    className?: string;
    color?: string;
    size?: LoadingPredatorSize;
    label?: string;
    showLabel?: boolean;
};

type PredatorStyle = CSSProperties & {
    "--predator-color": string;
};

export default function LoadingPredator({
    className = "",
    color = "currentColor",
    size = "medium",
    label = t("LoadingPredator.loading"),
    showLabel = false,
}: LoadingPredatorProps) {
    useTranslation();
    const reduced = useReducedMotion();
    const predatorStyle = {
        "--predator-color": color,
    } as PredatorStyle;

    return (
        <span
            className={`${styles.wrapper} ${styles[size]} ${showLabel ? styles.withLabel : ""
                } ${className}`.trim()}
            role="status"
            aria-live="polite"
            aria-label={label}
        >
            <motion.span aria-hidden="true" className={styles.spinner} style={predatorStyle} animate={{ rotate: reduced ? 0 : 360 }} transition={{ duration: reduced ? 0 : 0.8, ease: "linear", repeat: reduced ? 0 : Infinity }} />

            {showLabel && (
                <span className={styles.label}>
                    {label}
                </span>
            )}
        </span>
    );
}
