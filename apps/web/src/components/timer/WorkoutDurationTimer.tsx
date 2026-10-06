import { Play, Pause, Timer } from "lucide-react";
import Icon from "../ui/icon/Icon";
import {
    useWorkoutTimer,
    formatElapsedMilliseconds,
} from "@workout-app/shared/timer";

import Button from "../ui/button/Button";


import styles from "./WorkoutDurationTimer.module.css";

export default function WorkoutDurationTimer() {
    const { state, start, pause } = useWorkoutTimer();
    const isPaused = !state.isRunning;

    function handleToggleTimer() {
        if (isPaused) {
            start();
            return;
        }

        pause();
    }

    return (
        <section className={styles.timerCard}>
            <p className={styles.kicker}><Icon icon={Timer} /> Workout duration</p>

            <div className={styles.timeActions}>
                <strong className={styles.time}>
                    {formatElapsedMilliseconds(state.elapsedTime)}
                </strong>

                <Button
                    type="button"
                    variant="secondary"
                    onClick={handleToggleTimer}
                    className={styles.iconButton}
                    aria-label={isPaused ? "Start workout timer" : "Pause workout timer"}
                >
                    {isPaused ? (
                        <Icon icon={Play} className={styles.timerIcon} />
                    ) : (
                        <Icon icon={Pause} className={styles.timerIcon} />
                    )}
                </Button>
            </div>
        </section>
    );
}