import Button from "../ui/button/Button";
import styles from "./RestTimer.module.css";
import {
    formatCountdownMilliseconds,
    secondsToMilliseconds,
    useRestTimerControls,
} from "@workout-app/shared/timer/rest";

import PlayIcon from "../../assets/icons/play.svg?react";
import PauseIcon from "../../assets/icons/pause.svg?react";
import ResetIcon from "../../assets/icons/rotate-ccw.svg?react";

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
                    <Button
                        type="button"
                        variant="primary"
                        onClick={start}
                        className={styles.iconButton}
                        aria-label="Start rest timer"
                    >
                        <PlayIcon className={styles.timerIcon} />
                    </Button>

                    <Button
                        type="button"
                        variant="secondary"
                        onClick={pause}
                        className={styles.iconButton}
                        aria-label="Pause rest timer"
                    >
                        <PauseIcon className={styles.timerIcon} />
                    </Button>

                    <Button
                        type="button"
                        variant="ghost"
                        onClick={reset}
                        className={styles.iconButton}
                        aria-label="Reset rest timer"
                    >
                        <ResetIcon className={styles.timerIcon} />
                    </Button>
                </div>
            </div>
        </section>
    );
}