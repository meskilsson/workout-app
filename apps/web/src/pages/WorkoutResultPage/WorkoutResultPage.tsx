import { useLocation, useNavigate } from "react-router-dom";
import Box from "../../components/ui/box/Box";
import Card from "../../components/ui/cards/Card";
import Button from "../../components/ui/button/Button";
import styles from "./WorkoutResultPage.module.css"


type WorkoutSet = {
    weight: number;
    reps: number;
};

type WorkoutSessionExercise = {
    exerciseId: string | null;
    exerciseName: string;
    sets: WorkoutSet[];
};

type WorkoutSession = {
    _id: string;
    userId: string;
    exercises: WorkoutSessionExercise[];
    startedAt?: string | null;
    endedAt: string;
    createdAt: string;
    updatedAt: string;
};

type LocationState = {
    workoutSession: WorkoutSession;
};




export default function WorkoutResultPage() {

    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as LocationState | null;

    const workoutSession = state?.workoutSession;

    if (!workoutSession) {
        return (
            <Box className={styles.page}>
                <Card className={styles.card}>
                    <h1 className={styles.title}>No workout result found</h1>
                    <p className={styles.subtitle}>
                        This page needs saved workout data.
                    </p>

                    <div className={styles.actions}>
                        <Button onClick={() => navigate("/dashboard")}>
                            Back to Dashboard
                        </Button>
                    </div>
                </Card>
            </Box>
        );
    }

    const totalExercises = workoutSession.exercises.length;
    const totalSets = workoutSession.exercises.reduce(
        (sum, exercise) => sum + exercise.sets.length,
        0,
    );

    const endedAt = new Date(workoutSession.endedAt).toLocaleString('sv-SE');

    return (
        <Box className={styles.page}>
            <Card className={styles.card}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Workout Complete</h1>
                    <p className={styles.subtitle}>Saved successfully to your history.</p>
                </div>

                <div className={styles.summaryGrid}>
                    <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>Completed</span>
                        <span className={styles.summaryValue}>{endedAt}</span>
                    </div>

                    <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>Exercises</span>
                        <span className={styles.summaryValue}>{totalExercises}</span>
                    </div>

                    <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>Total Sets</span>
                        <span className={styles.summaryValue}>{totalSets}</span>
                    </div>
                </div>

                <div className={styles.exerciseList}>
                    {workoutSession.exercises.map((exercise, exerciseIndex) => (
                        <Card
                            key={`${exercise.exerciseId ?? exercise.exerciseName}-${exerciseIndex}`}
                            className={styles.exerciseCard}
                        >
                            <h2 className={styles.exerciseTitle}>{exercise.exerciseName}</h2>

                            <div className={styles.setList}>
                                {exercise.sets.map((set, index) => (
                                    <div key={index} className={styles.setRow}>
                                        <span>Set {index + 1}</span>
                                        <span>{set.weight} kg</span>
                                        <span>{set.reps} reps</span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    ))}
                </div>

                <div className={styles.actions}>
                    <Button variant="secondary" onClick={() => navigate("/dashboard")}>
                        Back to Dashboard
                    </Button>

                    <Button onClick={() => navigate("/workout-select")}>
                        Start Another Workout
                    </Button>
                </div>
            </Card>
        </Box>
    );
}