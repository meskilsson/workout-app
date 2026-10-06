import { useLocation } from "react-router-dom";
import LoadingState from "./LoadingState";
import type { SkeletonLayout } from "./Skeleton";
import styles from "./LoadingState.module.css";

export default function AppLoadingSkeleton({ message }: { message: string }) {
    const { pathname } = useLocation();
    let layout: SkeletonLayout = "cards";
    if (/^\/workout\//.test(pathname)) layout = "workout";
    else if (/workout-(result|history)|templates-details|\/exercises\//.test(pathname)) layout = "details";
    else if (/workout-summary/.test(pathname)) layout = "summary";
    else if (/library/.test(pathname)) layout = "library";
    else if (/exercise-select/.test(pathname)) layout = "exercises";
    else if (/edit-exercise|login|signup/.test(pathname)) layout = "form";
    else if (/profile/.test(pathname)) layout = "list";
    return <div>
        <div aria-hidden="true" className={styles.appHeader} />
        <LoadingState message={message} layout={layout} />
    </div>;
}
