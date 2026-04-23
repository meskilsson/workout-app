import Box from "../ui/box/Box";
import Card from "../ui/cards/Card";
import Button from "../ui/button/Button";
import { useTimer, formatMilliseconds } from "@workout-app/shared/timer";

export default function Timer() {
    const { state, start, pause, reset } = useTimer();

    return (
        <Box className="timer-root">
            <Card title="Timer" className="timer-card" variant="timer">
                <p>Time Left: {formatMilliseconds(state.timeLeft)}</p>

                <div className="timer-actions">
                    <Button variant="primary" onClick={start}>
                        Start
                    </Button>
                    <Button variant="secondary" onClick={pause}>
                        Pause
                    </Button>
                    <Button variant="ghost" onClick={reset}>
                        Reset
                    </Button>
                </div>
            </Card>
        </Box>
    );
}