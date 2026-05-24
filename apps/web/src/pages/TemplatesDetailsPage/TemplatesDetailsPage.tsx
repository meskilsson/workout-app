import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";

import { getPublicWorkoutTemplateByIdRequest } from "../../services/workoutTemplateApi";
import { getExerciseByIdRequest } from "../../services/exerciseApi";

import type { WorkoutTemplate, Exercise } from "@workout-app/shared";

import MuscleDummy from "../../components/muscleDummy/MuscleDummy";
import Box from "../../components/ui/box/Box";
import Card from "../../components/ui/cards/Card";

import styles from "./TemplatesDetailsPage.module.css";

export default function TemplatesDetailsPage() {
    const [template, setTemplate] = useState<WorkoutTemplate | null>(null);
    const [exerciseDetails, setExerciseDetails] = useState<Exercise[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const { id } = useParams();

    useEffect(() => {
        if (!id) {
            setError("Missing template id");
            return;
        }

        const templateId = id;

        let shouldIgnore = false;

        async function loadTemplateDetails() {
            setError("");
            setIsLoading(true);



            try {
                const templateData = await getPublicWorkoutTemplateByIdRequest(templateId);

                const uniqueExerciseIds = Array.from(
                    new Set(
                        templateData.exercises.map(
                            (templateExercise) => templateExercise.exercise._id,
                        ),
                    ),
                );

                const fullExerciseData = await Promise.all(
                    uniqueExerciseIds.map((exerciseId) =>
                        getExerciseByIdRequest(exerciseId),
                    ),
                );

                if (shouldIgnore) return;

                setTemplate(templateData);
                setExerciseDetails(fullExerciseData);
            } catch (error) {
                if (shouldIgnore) return;

                if (error instanceof Error) {
                    setError(error.message || "Failed to fetch template details");
                } else {
                    setError("Something went wrong");
                }
            } finally {
                if (!shouldIgnore) {
                    setIsLoading(false);
                }
            }
        }

        loadTemplateDetails();

        return () => {
            shouldIgnore = true;
        };
    }, [id]);

    if (isLoading) {
        return (
            <Box className={styles.page}>
                <Card className={styles.stateCard}>
                    <p>Loading workout...</p>
                </Card>
            </Box>
        );
    }

    if (error) {
        return (
            <Box className={styles.page}>
                <Card className={styles.stateCard}>
                    <p className={styles.errorText}>{error}</p>
                </Card>
            </Box>
        );
    }

    if (!template) {
        return (
            <Box className={styles.page}>
                <Card className={styles.stateCard}>
                    <p>No workout template found.</p>
                </Card>
            </Box>
        );
    }


    return (
        <Box className={styles.page}>
            <header className={styles.header}>
                <p className={styles.kicker}>Workout template</p>

                <div className={styles.headerTop}>
                    <div>
                        <h1 className={styles.title}>{template.name}</h1>

                        <p className={styles.subtitle}>
                            {template.description || "Overview of this workout."}
                        </p>
                    </div>
                </div>
            </header>


            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <div>
                        <h2 className={styles.sectionTitle}>Exercises</h2>

                        <p className={styles.sectionText}>
                            Full exercise overview with muscles, instructions and planned sets.
                        </p>
                    </div>

                    <span className={styles.categoryBadge}>
                        {template.category}
                    </span>
                </div>

                <div className={styles.exerciseCardGrid}>
                    {template.exercises.map((templateExercise) => {
                        const exercise = templateExercise.exercise;

                        const fullExercise = exerciseDetails.find(
                            (exerciseDetail) =>
                                exerciseDetail._id === templateExercise.exercise._id,
                        );

                        const primaryMuscles =
                            fullExercise?.primaryMuscles ?? exercise.primaryMuscles ?? [];

                        const secondaryMuscles =
                            fullExercise?.secondaryMuscles ??
                            exercise.secondaryMuscles ??
                            [];

                        const plannedSets = templateExercise.plannedSets ?? [];

                        return (
                            <Card
                                key={templateExercise._id}
                                className={styles.exerciseCard}
                            >
                                <div className={styles.orderPill}>
                                    <p className={styles.exerciseOrder}>
                                        {templateExercise.order + 1}.
                                    </p>
                                </div>

                                <div className={styles.exerciseContent}>
                                    <div className={styles.exerciseInfo}>
                                        <div>
                                            <p className={styles.exerciseKicker}>
                                                {fullExercise?.exerciseType ||
                                                    exercise.exerciseType ||
                                                    "Exercise"}
                                            </p>

                                            <h3 className={styles.exerciseName}>
                                                {templateExercise.exerciseName}
                                            </h3>
                                        </div>

                                        <div className={styles.metaGrid}>
                                            <div className={styles.metaItem}>
                                                <span>Equipment</span>
                                                <strong>
                                                    {fullExercise?.equipment ||
                                                        exercise.equipment ||
                                                        "Not specified"}
                                                </strong>
                                            </div>

                                            <div className={styles.metaItem}>
                                                <span>Difficulty</span>
                                                <strong>
                                                    {fullExercise?.difficulty ||
                                                        exercise.difficulty ||
                                                        "Not specified"}
                                                </strong>
                                            </div>

                                            <div className={styles.metaItem}>
                                                <span>Sets</span>
                                                <strong>{plannedSets.length || "—"}</strong>
                                            </div>
                                        </div>

                                        {fullExercise?.description && (
                                            <div className={styles.descriptionBlock}>
                                                <p className={styles.blockTitle}>
                                                    Description
                                                </p>

                                                <p className={styles.descriptionText}>
                                                    {fullExercise.description}
                                                </p>
                                            </div>
                                        )}

                                        <div className={styles.instructionsBlock}>
                                            <p className={styles.blockTitle}>
                                                Instructions
                                            </p>

                                            <p className={styles.instructions}>
                                                {fullExercise?.instructions ||
                                                    "No instructions available."}
                                            </p>
                                        </div>

                                        <div className={styles.setsBlock}>
                                            <p className={styles.blockTitle}>
                                                Planned sets
                                            </p>

                                            {plannedSets.length > 0 ? (
                                                <div className={styles.setList}>
                                                    {plannedSets.map((plannedSet, index) => (
                                                        <div
                                                            key={index}
                                                            className={styles.setRow}
                                                        >
                                                            <span>Set {index + 1}</span>

                                                            <strong>
                                                                {plannedSet.weight
                                                                    ? `${plannedSet.weight} kg`
                                                                    : "No weight"}
                                                            </strong>

                                                            <strong>
                                                                {plannedSet.reps
                                                                    ? `${plannedSet.reps} reps`
                                                                    : "No reps"}
                                                            </strong>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className={styles.emptyText}>
                                                    No planned sets added.
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <aside className={styles.visualPanel}>
                                        {fullExercise?.imageUrl && (
                                            <img
                                                className={styles.exerciseImage}
                                                src={fullExercise.imageUrl}
                                                alt={templateExercise.exerciseName}
                                            />
                                        )}
                                        <div className={styles.muscleGroups}>
                                            <div className={styles.muscleGroup}>
                                                <p className={styles.muscleGroupTitle}>Primary</p>

                                                <div className={styles.muscleChipList}>
                                                    {primaryMuscles.length > 0 ? (
                                                        primaryMuscles.map((muscle) => (
                                                            <span key={muscle} className={styles.primaryChip}>
                                                                {muscle}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className={styles.emptyChip}>None</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className={styles.muscleGroup}>
                                                <p className={styles.muscleGroupTitle}>Secondary</p>

                                                <div className={styles.muscleChipList}>
                                                    {secondaryMuscles.length > 0 ? (
                                                        secondaryMuscles.map((muscle) => (
                                                            <span key={muscle} className={styles.secondaryChip}>
                                                                {muscle}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className={styles.emptyChip}>None</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className={styles.muscleDummy}>
                                                <MuscleDummy
                                                    variant="full"
                                                    primaryMuscles={primaryMuscles}
                                                    secondaryMuscles={secondaryMuscles}
                                                />
                                            </div>
                                        </div>
                                        {fullExercise?.videoUrl && (
                                            <a
                                                className={styles.videoLink}
                                                href={fullExercise.videoUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                Watch exercise video
                                            </a>
                                        )}
                                    </aside>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </section>
        </Box>
    );
}