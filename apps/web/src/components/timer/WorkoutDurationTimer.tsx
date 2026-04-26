import { useWorkoutTimer, formatElapsedMilliseconds } from "@workout-app/shared/timer";

export default function WorkoutDurationTimer() {
    const { state } = useWorkoutTimer();

    return (
        <div>
            <p>Workout Duration</p>
            <p>{formatElapsedMilliseconds(state.elapsedTime)}</p>
        </div>
    );
}