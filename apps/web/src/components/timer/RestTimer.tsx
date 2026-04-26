import {
    useRestTimer,
    secondsToMilliseconds,
    formatCountdownMilliseconds,
} from "@workout-app/shared/timer/rest";


export default function RestTimer() {
    const { state, start, pause, reset } = useRestTimer(
        secondsToMilliseconds(60),
    );

    return (
        <div>
            <span>Rest Timer</span>
            <span>
                {formatCountdownMilliseconds(state.timeLeft)}
            </span>

            <div>
                <button type="button" onClick={start}>Start</button>
                <button type="button" onClick={pause}>Pause</button>
                <button type="button" onClick={reset}>Reset</button>
            </div>
        </div>
    );
}