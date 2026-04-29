import {
    useWorkoutTimer,
    formatElapsedMilliseconds,
} from "@workout-app/shared/timer";
import styles from "./WorkoutDurationTimer.module.css";

export default function WorkoutDurationTimer() {
    const { state } = useWorkoutTimer();

    return (
        <section className={styles.timerCard}>
            <p className={styles.kicker}>Workout duration</p>

            <strong className={styles.time}>
                {formatElapsedMilliseconds(state.elapsedTime)}
            </strong>
        </section>
    );
}