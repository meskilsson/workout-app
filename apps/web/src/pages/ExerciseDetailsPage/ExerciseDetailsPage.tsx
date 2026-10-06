import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

import styles from "./ExerciseDetailsPage.module.css";
import LoadingState from "../../components/Loading/LoadingState";

import Box from "../../components/ui/box/Box";
import Card from "../../components/ui/cards/Card";
import Button from "../../components/ui/button/Button";
import MuscleDummy from "../../components/muscleDummy/MuscleDummy";

import { getLibraryExerciseByIdRequest, getPublicExerciseByIdRequest } from "../../services/exerciseApi";
import type { Exercise } from "@workout-app/shared";

import { useAuth } from "../../context/AuthContext";

export default function ExerciseDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const [exercise, setExercise] = useState<Exercise | null>(null);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!id) {
            setError("Exercise details id is missing.");
            setIsLoading(false);
            return;
        }

        const exerciseId = id;

        async function getExercise() {
            setError("");
            setIsLoading(true);

            try {
                const data = isAuthenticated
                    ? await getLibraryExerciseByIdRequest(exerciseId)
                    : await getPublicExerciseByIdRequest(exerciseId);
                setExercise(data);
            } catch (error) {
                if (error instanceof Error) {
                    setError(error.message || "Failed to fetch exercise");
                } else {
                    setError("Something went wrong");
                }
            } finally {
                setIsLoading(false);
            }
        }

        getExercise();
    }, [id, isAuthenticated]);

    if (isLoading && !exercise) {
        return (
            <LoadingState
                layout="details"
                className={styles.page}
                title="Exercise details"
                message="Loading exercise details..."
            />
        );
    }

    if (error || !exercise) {
        return (
            <Box className={styles.page}>
                <Card className={styles.stateCard}>
                    <p className={styles.stateTitle}>Exercise details</p>

                    <p className={styles.errorText}>
                        {error || "Exercise details not found."}
                    </p>

                    <Button
                        type="button"
                        variant="secondary"
                        style={{ minWidth: "3.25rem", marginTop: "1rem" }}
                        className={styles.backButton}
                        onClick={() => navigate(-1)}

                    >
                        <span className={styles.buttonArrow}>←</span>
                    </Button>
                </Card>
            </Box>
        );
    }

    const primaryMuscles = exercise.primaryMuscles ?? [];
    const secondaryMuscles = exercise.secondaryMuscles ?? [];
    const imageUrl = exercise.imageUrl?.trim() || "";
    const hasImage = imageUrl.length > 0;

    return (
        <Box className={styles.page}>
            <header className={styles.header}>
                <div>
                    <p className={styles.kicker}>Exercise details</p>

                    <h1 className={styles.title}>{exercise.name}</h1>

                    <p className={styles.subtitle}>
                        Details of the exercise, instructions, equipment, difficulty,
                        and trained muscles.
                    </p>
                    <Button
                        type="button"
                        variant="secondary"
                        style={{ minWidth: "3.25rem", marginTop: "1rem" }}
                        className={styles.backButton}
                        onClick={() => navigate(-1)}

                    >
                        <span className={styles.buttonArrow}>←</span>
                    </Button>
                </div>


            </header>

            <Card className={styles.summaryCard}>
                <div
                    className={`${styles.exerciseGrid} ${hasImage ? styles.withImage : styles.withoutImage
                        }`}
                >
                    <section className={styles.infoColumn}>
                        <div className={styles.titleBlock}>

                            <p className={styles.exerciseMetaText}>
                                {exercise.exerciseType} · {exercise.equipment} ·{" "}
                                {exercise.difficulty}
                            </p>
                        </div>

                        <p className={styles.description}>
                            {exercise.description || "No description provided."}
                        </p>

                        <div className={styles.quickInfo}>
                            <div className={styles.quickInfoItem}>
                                <span className={styles.quickInfoLabel}>Type</span>
                                <span className={styles.quickInfoValue}>
                                    {exercise.exerciseType}
                                </span>
                            </div>

                            <div className={styles.quickInfoItem}>
                                <span className={styles.quickInfoLabel}>Equipment</span>
                                <span className={styles.quickInfoValue}>
                                    {exercise.equipment}
                                </span>
                            </div>

                            <div className={styles.quickInfoItem}>
                                <span className={styles.quickInfoLabel}>Difficulty</span>
                                <span className={styles.quickInfoValue}>
                                    {exercise.difficulty}
                                </span>
                            </div>
                        </div>

                        <div className={styles.muscleSection}>
                            <h3 className={styles.sectionTitle}>Primary muscles</h3>

                            {primaryMuscles.length > 0 ? (
                                <div className={styles.muscleTags}>
                                    {primaryMuscles.map((muscle) => (
                                        <span key={muscle} className={styles.primaryTag}>
                                            {muscle}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className={styles.emptyText}>No primary muscles listed.</p>
                            )}
                        </div>

                        {secondaryMuscles.length > 0 && (
                            <div className={styles.muscleSection}>
                                <h3 className={styles.sectionTitle}>Secondary muscles</h3>

                                <div className={styles.muscleTags}>
                                    {secondaryMuscles.map((muscle) => (
                                        <span key={muscle} className={styles.secondaryTag}>
                                            {muscle}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className={styles.instructionsBlock}>
                            <h3 className={styles.sectionTitle}>Instructions</h3>

                            <p className={styles.instructions}>
                                {exercise.instructions || "No instructions provided."}
                            </p>
                        </div>
                    </section>

                    <section className={`${styles.visualColumn} ${styles.muscleColumn}`}>
                        <div className={styles.cardDummy}>
                            <MuscleDummy
                                variant="mini"
                                primaryMuscles={primaryMuscles}
                                secondaryMuscles={secondaryMuscles}
                            />
                        </div>
                    </section>

                    {hasImage && (
                        <section className={`${styles.visualColumn} ${styles.imageColumn}`}>
                            <img
                                className={styles.exerciseImage}
                                src={imageUrl}
                                alt={exercise.name}
                            />
                        </section>
                    )}
                </div>
            </Card>
        </Box>
    );
}