import { useLocation } from "react-router-dom";
import LoadingState from "./LoadingState";
import type { SkeletonLayout } from "./Skeleton";
import styles from "./LoadingState.module.css";

export default function AppLoadingSkeleton({ message }: { message: string }) {
    const { pathname } = useLocation();
    let layout: SkeletonLayout = "cards";
    if (pathname === "/") layout = "home";
    else if (/^\/workout\//.test(pathname)) layout = "workout";
    else if (/workout-result/.test(pathname)) layout = "result";
    else if (/templates-details/.test(pathname)) layout = "templateDetails";
    else if (/\/exercises\//.test(pathname)) layout = "exerciseDetails";
    else if (/workout-summary/.test(pathname)) layout = "summary";
    else if (/library/.test(pathname)) layout = "library";
    else if (/exercise-select/.test(pathname)) layout = "exercises";
    else if (pathname === "/login") layout = "login";
    else if (pathname === "/signup") layout = "signup";
    else if (/edit-exercise|create-exercise/.test(pathname)) layout = "form";
    else if (pathname === "/workout-select") layout = "selection";
    else if (pathname === "/templates/create") layout = "templateIntro";
    else if (/profile\/settings/.test(pathname)) layout = "settings";
    else if (pathname === "/profile") layout = "profile";
    else if (/profile\/workouts\//.test(pathname)) layout = "sessionDetails";
    else if (/profile/.test(pathname)) layout = "list";
    return <div>
        <div aria-hidden="true" className={styles.appHeader} />
        <LoadingState message={message} layout={layout} />
    </div>;
}
