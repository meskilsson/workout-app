import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Box from "../../components/ui/box/Box";
import Card from "../../components/ui/cards/Card";
import Button from "../../components/ui/button/Button";
import { getMyWorkoutSessionsRequest } from "../../services/workoutSessionApi";
import styles from "./ProfilePage.module.css";

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

export default function ProfilePage() {
    const navigate = useNavigate();

    const [sessions, setSessions] = useState<WorkoutSession[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadWorkoutHistory() {
            setError("");
            setIsLoading(true);

            try {
                const data = await getMyWorkoutSessionsRequest();
                setSessions(data);
            } catch (err) {
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError("Failed to load workout history");
                }
            } finally {
                setIsLoading(false);
            }
        }

        loadWorkoutHistory();
    }, []);

    return (
        <Box className={styles.page}>
            <Box className={styles.container}>
                <div className={styles.header}>
                    <div>
                        <h1 className={styles.title}>Profile</h1>
                        <p className={styles.subtitle}>Your saved workout history.</p>
                    </div>

                    <Button variant="secondary" onClick={() => navigate("/dashboard")}>
                        Back to Dashboard
                    </Button>
                </div>

                {isLoading ? (
                    <Card className={styles.stateCard}>
                        <p className={styles.stateText}>Loading workout history...</p>
                    </Card>
                ) : error ? (
                    <Card className={styles.stateCard}>
                        <p className={styles.errorText}>{error}</p>
                    </Card>
                ) : sessions.length === 0 ? (
                    <Card className={styles.stateCard}>
                        <p className={styles.stateText}>No workouts saved yet.</p>
                    </Card>
                ) : (
                    <div className={styles.sessionList}>
                        {sessions.map((session) => {
                            const totalSets = session.exercises.reduce(
                                (sum, exercise) => sum + exercise.sets.length,
                                0,
                            );

                            const completedAt = new Date(session.endedAt).toLocaleString();

                            return (
                                <Card key={session._id} className={styles.sessionCard}>
                                    <div className={styles.sessionTopRow}>
                                        <div>
                                            <h2 className={styles.sessionTitle}>Workout Session</h2>
                                            <p className={styles.sessionDate}>{completedAt}</p>
                                        </div>

                                        <Button
                                            variant="ghost"
                                            onClick={() =>
                                                navigate(`/profile/workouts/${session._id}`, {
                                                    state: { workoutSession: session },
                                                })
                                            }
                                        >
                                            View Details
                                        </Button>
                                    </div>

                                    <div className={styles.summaryGrid}>
                                        <div className={styles.summaryItem}>
                                            <span className={styles.summaryLabel}>Exercises</span>
                                            <span className={styles.summaryValue}>
                                                {session.exercises.length}
                                            </span>
                                        </div>

                                        <div className={styles.summaryItem}>
                                            <span className={styles.summaryLabel}>Total Sets</span>
                                            <span className={styles.summaryValue}>{totalSets}</span>
                                        </div>
                                    </div>

                                    <div>
                                        {session.exercises.map((exercise) => (
                                            <div key={exercise.exerciseName}>
                                                <h3>{exercise.exerciseName}</h3>

                                                {exercise.sets.map((set, index) => (
                                                    <div key={index}>
                                                        <span>Set: {index + 1}</span>
                                                        <span>{set.weight} kg</span>
                                                        <span>{set.reps} reps</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>


                                    <div className={styles.exercisePreview}>
                                        {session.exercises.slice(0, 5).map((exercise) => (
                                            <span
                                                key={`${session._id}-${exercise.exerciseName}`}
                                                className={styles.exerciseTag}
                                            >
                                                {exercise.exerciseName}
                                            </span>
                                        ))}


                                        {session.exercises.length > 5 && (
                                            <span className={styles.moreText}>
                                                +{session.exercises.length - 3} more
                                            </span>
                                        )}
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </Box>
        </Box>
    );
}