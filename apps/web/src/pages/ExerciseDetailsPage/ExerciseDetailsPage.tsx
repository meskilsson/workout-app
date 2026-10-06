import { ArrowLeft } from "lucide-react";
import Icon from "../../components/ui/icon/Icon";
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
                    setError("Unable to complete this request. Please try again.");
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
                layout="exerciseDetails"
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
                        iconOnly
                        className={styles.backButton}
                    aria-label="Go back"
                        onClick={() => navigate(-1)}

                    >
                        <Icon icon={ArrowLeft} />
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

                    <h1 className={styles.title}>{exercise.name}</h1>

                    <p className={styles.subtitle}>
                        Equipment, technique, and target muscles.
                    </p>
                    <Button
                        type="button"
                        variant="secondary"
                        style={{ minWidth: "3.25rem", marginTop: "1rem" }}
                        iconOnly
                        className={styles.backButton}
                    aria-label="Go back"
                        onClick={() => navigate(-1)}

                    >
                        <Icon icon={ArrowLeft} />
                    </Button>
                </div>


            </header>

            <Card className={styles.summaryCard}>
                <div
                    className={`${styles.exerciseGrid} ${hasImage ? styles.withImage : styles.withoutImage
                        }`}
                >
                    <section className={styles.infoColumn}>
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
