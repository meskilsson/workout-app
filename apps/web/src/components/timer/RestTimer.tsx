import Button from "../ui/button/Button";
import styles from "./RestTimer.module.css";
import {
    formatCountdownMilliseconds,
    secondsToMilliseconds,
    useRestTimerControls,
} from "@workout-app/shared/timer/rest";

export default function RestTimer() {
    const { state, start, pause, reset, adjustTime } = useRestTimerControls();

    return (
        <section className={styles.timer}>
            <div className={styles.info}>
                <span className={styles.label}>Rest timer</span>

                <strong className={styles.time}>
                    {formatCountdownMilliseconds(state.timeLeft)}
                </strong>
            </div>

            <div className={styles.controls}>
                <div className={styles.adjustActions}>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => adjustTime(-secondsToMilliseconds(10))}
                        disabled={state.timeLeft <= 0}
                    >
                        -10s
                    </Button>

                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => adjustTime(secondsToMilliseconds(10))}
                    >
                        +10s
                    </Button>
                </div>

                <div className={styles.actions}>
                    <Button type="button" variant="primary" onClick={start}>
                        Start
                    </Button>

                    <Button type="button" variant="secondary" onClick={pause}>
                        Pause
                    </Button>

                    <Button type="button" variant="ghost" onClick={reset}>
                        Reset
                    </Button>
                </div>
            </div>
        </section>
    );
}