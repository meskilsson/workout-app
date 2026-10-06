import type { CSSProperties } from "react";
import styles from "./LoadingState.module.css";

export type SkeletonLayout = "cards" | "library" | "exercises" | "list" | "details" | "workout" | "summary" | "form" | "muscles";

type SkeletonProps = { width?: string; height?: string; className?: string };
export function Skeleton({ width = "100%", height = "1rem", className = "" }: SkeletonProps) {
    return <div aria-hidden="true" className={`${styles.shape} ${className}`} style={{ width, height } as CSSProperties} />;
}
export function LoadingAnnouncement({ message }: { message: string }) {
    return <span className={styles.srOnly} role="status" aria-live="polite">{message}</span>;
}
export function SkeletonContent({ layout }: { layout: SkeletonLayout }) {
    if (layout === "muscles") return <div className={styles.stack}><Skeleton height="2rem" /><Skeleton width="70%" /></div>;
    const workout = layout === "workout";
    const form = layout === "form";
    const detail = layout === "details" || layout === "summary";
    const grid = layout === "cards" || layout === "exercises" || layout === "library";
    return <div className={`${styles.content} ${workout || form ? styles.narrow : ""}`}>
        {workout ? <div className={styles.timer}><Skeleton width="8rem" /><Skeleton width="5rem" height="2rem" /></div>
            : <div className={styles.heading}><Skeleton width="7rem" height="0.8rem" /><Skeleton width="min(75%, 26rem)" height="2.75rem" /><Skeleton width="min(90%, 36rem)" /></div>}
        {grid && <div className={styles.search}><Skeleton height="3rem" /></div>}
        {detail && <div className={styles.stats}>{[0, 1, 2].map(i => <div className={styles.card} key={i}><Skeleton width="60%" /><Skeleton height="2rem" /></div>)}</div>}
        <div className={grid ? styles.grid : styles.stack}>
            {Array.from({ length: form ? 1 : grid ? 6 : 3 }, (_, index) => <div key={index} className={`${styles.card} ${layout === "exercises" || layout === "library" ? styles.exerciseCard : ""}`}>
                <div className={styles.cardHeader}><Skeleton width="60%" height="1.4rem" /><Skeleton width="3rem" height="2rem" /></div>
                {form ? <div className={styles.stack}>{[0, 1, 2, 3].map(i => <div className={styles.stack} key={i}><Skeleton width="6rem" /><Skeleton height={i === 2 ? "6rem" : "3rem"} /></div>)}</div>
                    : workout ? <div className={styles.workoutRows}>{[0, 1, 2].map(i => <div className={styles.workoutRow} key={i}><Skeleton height="2.75rem" /><Skeleton height="2.75rem" /><Skeleton height="2.75rem" /><Skeleton height="2.75rem" /></div>)}</div>
                    : <><Skeleton /><Skeleton width="80%" /><Skeleton width="65%" />{(layout === "exercises" || layout === "library") && <Skeleton height="10rem" />}{(layout === "list" || (grid && layout !== "library")) && <div className={styles.cardActions}><Skeleton height="2.75rem" /><Skeleton height="2.75rem" /></div>}</>}
            </div>)}
        </div>
        {workout && <div className={styles.cardActions}><Skeleton width="9rem" height="2.75rem" /><Skeleton width="9rem" height="2.75rem" /></div>}
    </div>;
}
