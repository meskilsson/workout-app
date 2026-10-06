import { useNavigate } from "react-router-dom";
import { ArrowRight, BookOpen, Dumbbell, History, Plus } from "lucide-react";
import { useCurrentWorkout } from "@workout-app/shared/currentWorkoutContext";
import { useWorkoutTimer, formatElapsedMilliseconds } from "@workout-app/shared/timer";
import Button from "../../components/ui/button/Button";
import Icon from "../../components/ui/icon/Icon";
import { useAuth } from "../../context/AuthContext";
import styles from "./Homepage.module.css";

export default function Homepage() {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const { currentWorkoutId } = useCurrentWorkout();
    const { state } = useWorkoutTimer();
    const destinations = [
        { title: "Workout templates", description: "Choose a routine or manage your own.", icon: Dumbbell, path: "/templates" },
        { title: "Exercise library", description: "Find movements and the muscles they target.", icon: BookOpen, path: "/library" },
        ...(isAuthenticated ? [{ title: "Workout history", description: "Review completed sessions or train them again.", icon: History, path: "/profile/workouts" }] : []),
    ];
    return (
        <div className={styles.page}>
            <header className={styles.intro}>
                <p className={styles.kicker}>{user?.name ? `Welcome back, ${user.name}.` : "Your training, in one place."}</p>
                <h1 className={styles.title}>Ready for your next session?</h1>
                <p className={styles.subtitle}>Plan your workout. Log your sets. Keep moving forward.</p>
            </header>
            <section className={styles.sessionSection} aria-label="Start or resume training">
                {isAuthenticated && currentWorkoutId && <div className={styles.activeSession}>
                    <div><p className={styles.kicker}>Active session</p><h2>Your workout is ready to continue.</h2>
                        <p className={styles.sessionTime}>{formatElapsedMilliseconds(state.elapsedTime)} <span>{state.isRunning ? "elapsed" : "paused"}</span></p>
                    </div>
                    <Button variant="secondary" onClick={() => navigate(`/workout/${currentWorkoutId}`)} icon={ArrowRight}>Resume workout</Button>
                </div>}
                <div className={styles.newSession}>
                    <div><h2>Start a workout</h2><p>Choose your exercises and build a session.</p></div>
                    <Button variant="secondary" onClick={() => navigate("/workout-select")} icon={Plus}>New workout</Button>
                </div>
            </section>
            <section className={styles.section} aria-labelledby="training-heading">
                <h2 id="training-heading">Your training</h2>
                <div className={styles.destinations}>
                    {destinations.map(item => <button key={item.path} type="button" className={styles.destination} onClick={() => navigate(item.path)}>
                        <Icon icon={item.icon} /><span><strong>{item.title}</strong><span>{item.description}</span></span><Icon icon={ArrowRight} />
                    </button>)}
                </div>
            </section>
        </div>
    );
}
