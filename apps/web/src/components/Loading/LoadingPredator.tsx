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
    color = "var(--color-primary)",
    size = "medium",
    label = "Loading",
    showLabel = false,
}: LoadingPredatorProps) {
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
            <span className={styles.visualShell} aria-hidden="true">
                <span
                    className={styles.loadingPredator}
                    style={predatorStyle}
                >
                    <span
                        className={`${styles.laser} ${styles.leftLaser}`}
                    />

                    <span
                        className={`${styles.laser} ${styles.rightLaser}`}
                    />

                    <span
                        className={`${styles.laser} ${styles.bottomLaser}`}
                    />
                </span>
            </span>

            {showLabel && (
                <span className={styles.label}>
                    {label}
                </span>
            )}
        </span>
    );
}