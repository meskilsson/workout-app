import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { muscleSearchAliases } from "@workout-app/shared";

import { useAuth } from "../../context/AuthContext";
import {
    getExerciseLibraryRequest,
    getPublicExercisesRequest,
} from "../../services/exerciseApi";
import {
    getWorkoutDraftByIdRequest,
    updateWorkoutDraftExercisesRequest,
} from "../../services/workoutDraftApi";

import Card from "../../components/ui/cards/Card";
import Box from "../../components/ui/box/Box";
import Button from "../../components/ui/button/Button";
import MuscleDummy from "../../components/muscleDummy/MuscleDummy";

import "../../components/ui/button/button.css";
import "../../components/ui/box/box.css";
import "../../components/ui/cards/card.css";

import styles from "./ExerciseSelectPage.module.css";

type Exercise = {
    _id: string;
    name: string;
    primaryMuscles?: string[];
    secondaryMuscles?: string[];
    exerciseType?: "strength" | "cardio" | "mobility";
    equipment?:
    | "bodyweight"
    | "dumbbell"
    | "barbell"
    | "machine"
    | "kettlebell"
    | "band";
    difficulty?: "beginner" | "intermediate" | "advanced";
    isCustom: boolean;
};

type SelectedMuscleGroup = {
    id: string;
    title: string;
};

type WorkoutDraft = {
    _id: string;
    status: "building" | "active" | "completed" | "abandoned";
    selectedMuscleGroups: string[];
    exercises: {
        exerciseId: string;
        exerciseName: string;
        sets: {
            weight: number | null;
            reps: number | null;
        }[];
    }[];
};

const muscleGroupMap: Record<string, string[]> = {
    chest: ["chest"],
    back: ["back"],
    shoulders: ["shoulders"],
    biceps: ["biceps"],
    triceps: ["triceps"],
    core: ["core"],
    quads: ["quads"],
    hamstrings: ["hamstrings"],
    glutes: ["glutes"],
    calves: ["calves"],
    ...muscleSearchAliases,
};

function formatMuscleTitle(muscle: string) {
    return muscle.charAt(0).toUpperCase() + muscle.slice(1);
}

export default function ExerciseSelectPage() {
    const { isAuthenticated } = useAuth();
    const { draftId } = useParams();
    const navigate = useNavigate();

    const [selectedMuscleGroups, setSelectedMuscleGroups] = useState<
        SelectedMuscleGroup[]
    >([]);
    const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
    const [exercises, setExercises] = useState<Exercise[]>([]);

    const [isLoadingExercises, setIsLoadingExercises] = useState(true);
    const [isLoadingDraft, setIsLoadingDraft] = useState(true);
    const [isSavingExercises, setIsSavingExercises] = useState(false);

    const [exerciseError, setExerciseError] = useState("");
    const [draftError, setDraftError] = useState("");
    const [actionError, setActionError] = useState("");

    const [searchTerm, setSearchTerm] = useState("");

    const isLoading = isLoadingExercises || isLoadingDraft;
    const error = draftError || exerciseError || actionError;

    useEffect(() => {
        async function loadExercises() {
            setExerciseError("");
            setIsLoadingExercises(true);

            try {
                const data = isAuthenticated
                    ? await getExerciseLibraryRequest()
                    : await getPublicExercisesRequest();

                setExercises(data);
            } catch (err) {
                setExerciseError(
                    err instanceof Error ? err.message : "Failed to load exercises",
                );
            } finally {
                setIsLoadingExercises(false);
            }
        }

        loadExercises();
    }, [isAuthenticated]);

    useEffect(() => {
        async function loadDraft() {
            if (!draftId) {
                navigate("/workout-select");
                return;
            }

            setDraftError("");
            setIsLoadingDraft(true);

            try {
                const data: WorkoutDraft = await getWorkoutDraftByIdRequest(draftId);

                setSelectedMuscleGroups(
                    data.selectedMuscleGroups.map((muscle) => ({
                        id: muscle,
                        title: formatMuscleTitle(muscle),
                    })),
                );

                setSelectedExercises(
                    data.exercises.map((exercise) => exercise.exerciseId),
                );
            } catch (err) {
                setDraftError(
                    err instanceof Error
                        ? err.message
                        : "Failed to load workout draft",
                );
            } finally {
                setIsLoadingDraft(false);
            }
        }

        loadDraft();
    }, [draftId, navigate]);

    function handleToggleExercise(exerciseId: string) {
        if (isSavingExercises) {
            return;
        }

        setSelectedExercises((prev) =>
            prev.includes(exerciseId)
                ? prev.filter((id) => id !== exerciseId)
                : [...prev, exerciseId],
        );
    }

    const groupedExercises = useMemo(() => {
        return selectedMuscleGroups.map((group) => {
            const normalizedSearch = searchTerm.trim().toLowerCase();

            const targetMuscles =
                muscleGroupMap[group.id.toLowerCase()] ?? [
                    group.title.trim().toLowerCase(),
                ];

            const searchAliasMuscles =
                muscleSearchAliases[normalizedSearch] ?? [];

            const matchingExercises = exercises.filter((exercise) => {
                const primary =
                    exercise.primaryMuscles?.map((muscle) =>
                        muscle.trim().toLowerCase(),
                    ) ?? [];

                const secondary =
                    exercise.secondaryMuscles?.map((muscle) =>
                        muscle.trim().toLowerCase(),
                    ) ?? [];

                const matchesMuscleGroup = targetMuscles.some((muscle) =>
                    primary.includes(muscle),
                );

                const matchesSearchAlias =
                    searchAliasMuscles.length > 0 &&
                    searchAliasMuscles.some(
                        (muscle) =>
                            primary.includes(muscle) || secondary.includes(muscle),
                    );

                const matchesSearch =
                    normalizedSearch === "" ||
                    exercise.name.toLowerCase().includes(normalizedSearch) ||
                    primary.some((muscle) => muscle.includes(normalizedSearch)) ||
                    secondary.some((muscle) => muscle.includes(normalizedSearch)) ||
                    matchesSearchAlias ||
                    (exercise.equipment
                        ?.toLowerCase()
                        .includes(normalizedSearch) ??
                        false) ||
                    (exercise.difficulty
                        ?.toLowerCase()
                        .includes(normalizedSearch) ??
                        false) ||
                    (exercise.exerciseType
                        ?.toLowerCase()
                        .includes(normalizedSearch) ??
                        false);

                return matchesMuscleGroup && matchesSearch;
            });

            return {
                ...group,
                exercises: matchingExercises,
            };
        });
    }, [selectedMuscleGroups, exercises, searchTerm]);

    const chosenExercises = exercises.filter((exercise) =>
        selectedExercises.includes(exercise._id),
    );

    async function handleContinue() {
        if (!draftId) {
            navigate("/workout-select");
            return;
        }

        setActionError("");
        setIsSavingExercises(true);

        try {
            await updateWorkoutDraftExercisesRequest(draftId, {
                exerciseIds: selectedExercises,
            });

            navigate(`/workout-summary/${draftId}`);
        } catch (err) {
            setActionError(
                err instanceof Error
                    ? err.message
                    : "Failed to save selected exercises",
            );
        } finally {
            setIsSavingExercises(false);
        }
    }

    if (isLoading) {
        return (
            <Box className={styles.page}>
                <div className={styles.stateCard}>
                    <p className={styles.kicker}>Exercise library</p>
                    <h1 className={styles.title}>Select exercises</h1>
                    <p className={styles.stateText}>Loading workout draft...</p>
                </div>
            </Box>
        );
    }

    if (draftError || exerciseError) {
        return (
            <Box className={styles.page}>
                <div className={styles.stateCard}>
                    <p className={styles.kicker}>Exercise library</p>
                    <h1 className={styles.title}>Select exercises</h1>
                    <p className={styles.errorText}>{error}</p>
                </div>
            </Box>
        );
    }

    return (
        <Box className={styles.page}>
            <div className={styles.header}>
                <div>
                    <p className={styles.kicker}>Exercise library</p>
                    <h1 className={styles.title}>Select exercises</h1>
                    <p className={styles.subtitle}>
                        Choose exercises for the muscle groups you selected.
                    </p>
                </div>

                <div className={styles.selectedBadge}>
                    {chosenExercises.length} selected
                </div>
            </div>

            <div className={styles.searchWrapper}>
                <input
                    className={styles.searchInput}
                    type="text"
                    placeholder="Search exercises, muscles, or equipment..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                />
            </div>

            {actionError && <p className={styles.errorText}>{actionError}</p>}

            <Box className={styles.groupList}>
                {groupedExercises.map((group) => (
                    <section key={group.id} className={styles.exerciseGroup}>
                        <div className={styles.groupHeader}>
                            <h2 className={styles.groupTitle}>{group.title}</h2>
                            <p className={styles.groupCount}>
                                {group.exercises.length} exercises
                            </p>
                        </div>

                        <Box className={styles.exerciseGrid}>
                            {group.exercises.length > 0 ? (
                                group.exercises.map((exercise) => {
                                    const isSelected = selectedExercises.includes(
                                        exercise._id,
                                    );

                                    return (
                                        <Card
                                            key={exercise._id}
                                            className={`${styles.exerciseCard} ${isSelected ? styles.selectedCard : ""
                                                }`}
                                            onClick={() =>
                                                handleToggleExercise(exercise._id)
                                            }
                                        >
                                            <div className={styles.exerciseCardContent}>
                                                <div className={styles.exerciseCardTop}>
                                                    <div className={styles.exerciseMainInfo}>
                                                        <h3 className={styles.exerciseName}>
                                                            {exercise.name}
                                                        </h3>

                                                        <div className={styles.exerciseMeta}>
                                                            {exercise.equipment && (
                                                                <span>
                                                                    {exercise.equipment}
                                                                </span>
                                                            )}

                                                            {exercise.difficulty && (
                                                                <span>
                                                                    {exercise.difficulty}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className={styles.cardDummy}>
                                                        <MuscleDummy
                                                            variant="mini"
                                                            primaryMuscles={
                                                                exercise.primaryMuscles ??
                                                                []
                                                            }
                                                            secondaryMuscles={
                                                                exercise.secondaryMuscles ??
                                                                []
                                                            }
                                                        />
                                                    </div>
                                                </div>

                                                <div className={styles.muscleInfo}>
                                                    {exercise.primaryMuscles &&
                                                        exercise.primaryMuscles.length >
                                                        0 && (
                                                            <div>
                                                                <p
                                                                    className={
                                                                        styles.muscleLabel
                                                                    }
                                                                >
                                                                    Primary
                                                                </p>

                                                                <div
                                                                    className={
                                                                        styles.muscleTags
                                                                    }
                                                                >
                                                                    {exercise.primaryMuscles.map(
                                                                        (muscle) => (
                                                                            <span
                                                                                key={muscle}
                                                                                className={
                                                                                    styles.primaryTag
                                                                                }
                                                                            >
                                                                                {muscle}
                                                                            </span>
                                                                        ),
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}

                                                    {exercise.secondaryMuscles &&
                                                        exercise.secondaryMuscles
                                                            .length > 0 && (
                                                            <div>
                                                                <p
                                                                    className={
                                                                        styles.muscleLabel
                                                                    }
                                                                >
                                                                    Secondary
                                                                </p>

                                                                <div
                                                                    className={
                                                                        styles.muscleTags
                                                                    }
                                                                >
                                                                    {exercise.secondaryMuscles.map(
                                                                        (muscle) => (
                                                                            <span
                                                                                key={muscle}
                                                                                className={
                                                                                    styles.secondaryTag
                                                                                }
                                                                            >
                                                                                {muscle}
                                                                            </span>
                                                                        ),
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                </div>
                                            </div>
                                        </Card>
                                    );
                                })
                            ) : (
                                <p className={styles.emptyText}>
                                    No exercises found for this muscle group.
                                </p>
                            )}
                        </Box>
                    </section>
                ))}
            </Box>

            <div className={styles.footer}>
                <p className={styles.footerText}>
                    {chosenExercises.length === 0
                        ? "Select at least one exercise to continue."
                        : `${chosenExercises.length} exercise${chosenExercises.length === 1 ? "" : "s"
                        } ready.`}
                </p>

                <Button
                    variant="primary"
                    onClick={handleContinue}
                    disabled={chosenExercises.length === 0 || isSavingExercises}
                >
                    {isSavingExercises ? "Saving..." : "Continue"}
                </Button>
            </div>
        </Box>
    );
}