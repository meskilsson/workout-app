import styles from "./LoadingPredator.module.css";

type LoadingPredatorProps = {
    className?: string;
};

export default function LoadingPredator({
    className = "",
}: LoadingPredatorProps) {
    return (
        <span
            className={`${styles.loadingPredator} ${className}`.trim()}
            role="status"
            aria-label="Loading"
        >
            <span className={`${styles.laser} ${styles.leftLaser}`} />
            <span className={`${styles.laser} ${styles.rightLaser}`} />
            <span className={`${styles.laser} ${styles.bottomLaser}`} />
        </span>
    );
}