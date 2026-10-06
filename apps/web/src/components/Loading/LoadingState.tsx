import type { CSSProperties } from "react";

import LoadingPredator from "./LoadingPredator";

import styles from "./LoadingState.module.css";

type LoadingStateVariant = "page" | "card" | "inline";

type LoadingStateProps = {
    title?: string;
    message: string;
    color?: string;
    variant?: LoadingStateVariant;
    className?: string;
};

type LoadingStateStyle = CSSProperties & {
    "--loading-color": string;
};

export default function LoadingState({
    title,
    message,
    color = "var(--color-primary)",
    variant = "page",
    className = "",
}: LoadingStateProps) {
    const loadingStyle = {
        "--loading-color": color,
    } as LoadingStateStyle;

    return (
        <div
            className={`${styles.loadingState} ${styles[variant]} ${className}`.trim()}
            style={loadingStyle}
            aria-busy="true"
        >
            <div className={styles.panel}>
                <div className={styles.predatorWrapper}>
                    <LoadingPredator
                        color={color}
                        size={variant === "inline" ? "small" : "large"}
                        label={message}
                    />
                </div>

                <div className={styles.copy}>
                    {title && (
                        <p className={styles.title}>
                            {title}
                        </p>
                    )}

                    <p className={styles.message}>
                        {message}
                    </p>
                </div>
            </div>
        </div>
    );
}