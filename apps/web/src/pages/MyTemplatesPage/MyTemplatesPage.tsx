import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Card from "../../components/ui/cards/Card";
import Button from "../../components/ui/button/Button";

import {
    getMyWorkoutTemplatesRequest,
    startWorkoutFromTemplateRequest,
} from "../../services/workoutTemplateApi";

import type { WorkoutTemplate } from "@workout-app/shared";

import styles from "../TemplatesPage/TemplatesPage.module.css";

export default function MyTemplatesPage() {
    const navigate = useNavigate();

    const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [startingTemplateId, setStartingTemplateId] = useState<string | null>(
        null,
    );

    useEffect(() => {
        async function fetchMyTemplates() {
            setError("");
            setIsLoading(true);

            try {
                const data = await getMyWorkoutTemplatesRequest();
                setTemplates(data);
            } catch (error) {
                if (error instanceof Error) {
                    setError(error.message);
                } else {
                    setError("Something went wrong");
                }
            } finally {
                setIsLoading(false);
            }
        }

        fetchMyTemplates();
    }, []);

    async function handleStartTemplate(templateId: string) {
        setError("");
        setStartingTemplateId(templateId);

        try {
            const draft = await startWorkoutFromTemplateRequest(templateId);
            navigate(`/workout-summary/${draft._id}`);
        } catch (error) {
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError("Failed to start workout from template");
            }
        } finally {
            setStartingTemplateId(null);
        }
    }

    if (isLoading) {
        return (
            <Card className={styles.stateCard}>
                <p>Loading your workouts...</p>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className={styles.stateCard}>
                <p className={styles.errorText}>{error}</p>
            </Card>
        );
    }

    return (
        <section className={styles.section}>
            <div className={styles.sectionHeader}>
                <div>
                    <h2 className={styles.sectionTitle}>My workouts</h2>
                    <p className={styles.sectionText}>
                        Workouts you have created yourself.
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

                <Button
                    type="button"
                    variant="secondary"
                    onClick={() => navigate("/templates/create")}
                >
                    Create workout
                </Button>
            </div>

            {templates.length > 0 ? (
                <div className={styles.templateGrid}>
                    {templates.map((template) => {
                        const isStarting = startingTemplateId === template._id;

                        return (
                            <Card
                                key={template._id}
                                className={styles.templateCard}
                            >
                                <div className={styles.cardHeader}>
                                    <div>
                                        <p className={styles.templateType}>
                                            My workout
                                        </p>

                                        <h2 className={styles.templateName}>
                                            {template.name}
                                        </h2>

                                        <p className={styles.templateDescription}>
                                            {template.description ||
                                                "No description."}
                                        </p>
                                    </div>

                                    <span className={styles.categoryBadge}>
                                        {template.category}
                                    </span>
                                </div>

                                <div className={styles.exerciseList}>
                                    {template.exercises.map((exercise) => (
                                        <div
                                            key={exercise._id}
                                            className={styles.exerciseItem}
                                        >
                                            <span>{exercise.order + 1}.</span>
                                            <span>{exercise.exerciseName}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className={styles.templateActions}>
                                    <Button
                                        type="button"
                                        disabled={isStarting}
                                        onClick={() =>
                                            handleStartTemplate(template._id)
                                        }
                                    >
                                        {isStarting
                                            ? "Starting..."
                                            : "Start workout"}
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={() => navigate(`templates-details/${template._id}`)}
                                    >
                                        View details
                                    </Button>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <Card className={styles.stateCard}>
                    <p>You have not created any workouts yet.</p>
                </Card>
            )}
        </section>
    );
}