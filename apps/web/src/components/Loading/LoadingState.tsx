import { LoadingAnnouncement, SkeletonContent, type SkeletonLayout } from "./Skeleton";
import styles from "./LoadingState.module.css";

type LoadingStateProps = {
    title?: string;
    message: string;
    color?: string;
    variant?: "page" | "card" | "inline";
    layout?: SkeletonLayout;
    className?: string;
};

export default function LoadingState({ title, message, variant = "page", layout = "cards", className = "" }: LoadingStateProps) {
    return <div className={`${styles.loadingState} ${!className ? styles[variant] : ""} ${className}`}>
        <LoadingAnnouncement message={message} />
        <div aria-busy="true" aria-label={title ?? "Loading content"} role="region" className={styles.region}>
            <div aria-hidden="true"><SkeletonContent layout={layout} /></div>
        </div>
    </div>;
}
