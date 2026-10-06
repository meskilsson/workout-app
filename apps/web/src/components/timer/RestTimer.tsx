import { Play, Pause, RotateCcw, Timer } from "lucide-react";
import { useState } from "react";
import { restAlertsEnabled, setRestAlertsEnabled } from "../../utils/restTimerAlerts";
import Icon from "../ui/icon/Icon";
import Button from "../ui/button/Button";
import styles from "./RestTimer.module.css";
import {
    formatCountdownMilliseconds,
    secondsToMilliseconds,
    useRestTimerControls,
} from "@workout-app/shared/timer/rest";


export default function RestTimer() {
    const { state, start, pause, reset, adjustTime } = useRestTimerControls();
    const [alertsEnabled, setAlertsEnabled] = useState(restAlertsEnabled);

    return (
        <section className={styles.timer}>
            <div className={styles.info}>
                <span className={styles.label}><Icon icon={Timer} /> Rest timer</span>

                <strong className={styles.time}>
                    {formatCountdownMilliseconds(state.timeLeft)}
                </strong>
            </div>
                <label className={styles.alertToggle}>
                    <input type="checkbox" checked={alertsEnabled} onChange={(event) => {
                        const value = event.target.checked;
                        setRestAlertsEnabled(value);
                        setAlertsEnabled(value);
                    }} />
                    Rest alerts
                </label>

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
                        variant="secondary"
                        onClick={start}
                        className={styles.iconButton}
                        aria-label="Start rest timer"
                    >
                        <Icon icon={Play} className={styles.timerIcon} />
                    </Button>

                    <Button
                        type="button"
                        variant="secondary"
                        onClick={pause}
                        className={styles.iconButton}
                        aria-label="Pause rest timer"
                    >
                        <Icon icon={Pause} className={styles.timerIcon} />
                    </Button>

                    <Button
                        type="button"
                        variant="ghost"
                        onClick={reset}
                        className={styles.iconButton}
                        aria-label="Reset rest timer"
                    >
                        <Icon icon={RotateCcw} className={styles.timerIcon} />
                    </Button>
                </div>
            </div>
        </section>
    );
}
