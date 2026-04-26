import { useEffect, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { getWorkoutSessionByIdRequest } from "../../services/workoutSessionApi"
import styles from './WorkoutHistoryDetailPage.module.css';
import formatDuration from "../../utils/formatDuration";

import type { WorkoutSession } from "@workout-app/shared";
import Box from "../../components/ui/box/Box";
import Button from "../../components/ui/button/Button";
import Card from "../../components/ui/cards/Card";

type LocationState = {
    workoutSession?: WorkoutSession;
};



export default function WorkoutHistoryDetailPage() {

    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams();


    const state = location.state as LocationState | null;

    const [session, setSession] = useState<WorkoutSession | null>(
        state?.workoutSession ?? null,
    );
    const [isLoading, setIsLoading] = useState(!state?.workoutSession);
    const [error, setError] = useState("");


    useEffect(() => {
        if (session) return;

        if (!id) {
            setError("Workout session id is missing.");
            setIsLoading(false);
            return;
        }

        const sessionId = id;

        async function loadSession() {
            setError("");
            setIsLoading(true);

            try {
                const data = await getWorkoutSessionByIdRequest(sessionId);
                setSession(data);
            } catch (err) {
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError("Failed to load workout session");
                }
            } finally {
                setIsLoading(false);
            }
        }

        loadSession();
    }, [id, session]);

    if (isLoading) {
        return (
            <Box className={styles.page}>
                <Box className={styles.container}>
                    <h1 className={styles.header}>Workout Details</h1>
                    <p className={styles.stateText}>Loading workout details...</p>
                </Box>
            </Box>
        );
    }

    if (error || !session) {
        return (
            <Box className={styles.page}>
                <Box className={styles.container}>
                    <h1 className={styles.header}>Workout Details</h1>
                    <p className={styles.errorText}>
                        {error || "Workout session not found."}
                    </p>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => navigate("/profile")}
                    >Back to Profile</Button>
                </Box>
            </Box>
        );
    }

    const totalSets = session.exercises.reduce(
        (sum, exercise) => sum + exercise.sets.length,
        0,
    );

    const completedAt = new Date(session.endedAt).toLocaleString();
    const duration = formatDuration(session.startedAt, session.endedAt);

    return (
        <Box className={styles.page}>
            <Box className={styles.container}>
                <Box className={styles.header}>
                    <h1 className={styles.title}>Workout Details</h1>
                    <p className={styles.subtitle}>A full breakdown of this workout session</p>
                </Box>

                <Button
                    type="button"
                    variant="secondary"
                    onClick={() => navigate("/profile")}
                >
                    Back to Profile
                </Button>
            </Box>

            <Card
                variant="primary"
            >
                <div className={styles.summaryGrid}>
                    <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>Completed</span>
                        <span className={styles.summaryValue}>{completedAt}</span>
                    </div>

                    <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>Total Sets</span>
                        <span className={styles.summaryValue}>{totalSets}</span>
                    </div>

                    <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>Duration</span>
                        <span className={styles.summaryValue}>{duration}</span>
                    </div>
                </div>

                <div className={styles.exerciseList}>
                    {session.exercises.map((exercise, exerciseIndex) => (
                        <article
                            key={`${exercise.exerciseId ?? exercise.exerciseName}-${exerciseIndex}`}
                            className={styles.exerciseCard}
                        >
                            <h2 className={styles.exerciseTitle}>{exercise.exerciseName}</h2>

                            <div className={styles.setList}>
                                {exercise.sets.map((set, setIndex) => (
                                    <div key={setIndex} className={styles.setRow}>
                                        <span className={styles.setIndex}>Set {setIndex + 1}</span>
                                        <span className={styles.setValue}>{set.weight} kg</span>
                                        <span className={styles.setValue}>{set.reps} reps</span>
                                    </div>
                                ))}
                            </div>
                        </article>
                    ))}
                </div>

            </Card>
        </Box>
    )
}