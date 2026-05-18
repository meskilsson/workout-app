import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

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
import type { Exercise } from "@workout-app/shared";

import { usePaginationScroll } from "../../hooks/usePaginationScroll";

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

    const [isLoadingExercises, setIsLoadingExercises] = useState(false);
    const [isLoadingDraft, setIsLoadingDraft] = useState(true);
    const [isSavingExercises, setIsSavingExercises] = useState(false);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

    const [exerciseError, setExerciseError] = useState("");
    const [draftError, setDraftError] = useState("");
    const [actionError, setActionError] = useState("");

    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

    const [limit] = useState(12);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    const { page, setPage, pageTopRef, handlePageChange } =
        usePaginationScroll<HTMLDivElement>(totalPages);

    const isLoading = isLoadingExercises || isLoadingDraft;
    const error = draftError || exerciseError || actionError;

    const selectedMuscleQuery = useMemo(() => {
        return selectedMuscleGroups.map((group) => group.id).join(",");
    }, [selectedMuscleGroups]);



    useEffect(() => {
        async function loadExercises() {
            if (!selectedMuscleQuery) {
                return;
            }

            setExerciseError("");
            setIsLoadingExercises(true);

            try {
                const options = {
                    page,
                    limit,
                    search: debouncedSearchTerm,
                    muscles: selectedMuscleQuery.split(","),
                };

                const data = isAuthenticated
                    ? await getExerciseLibraryRequest(options)
                    : await getPublicExercisesRequest(options);

                setExercises(data.exercises);
                setTotal(data.total);
                setTotalPages(data.totalPages);
            } catch (err) {
                setExerciseError(
                    err instanceof Error ? err.message : "Failed to load exercises",
                );
            } finally {
                setIsLoadingExercises(false);
                setHasLoadedOnce(true);
            }
        }

        loadExercises();
    }, [
        isAuthenticated,
        page,
        limit,
        debouncedSearchTerm,
        selectedMuscleQuery,
    ]);

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

    useEffect(() => {
        if (!isLoadingExercises && !isLoadingDraft) {
            setHasLoadedOnce(true);
        }
    }, [isLoadingExercises, isLoadingDraft]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            setDebouncedSearchTerm(searchTerm.trim());
            setPage(1);
        }, 300);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [searchTerm, setPage]);

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


    const exerciseGroupTitle =
        selectedMuscleGroups.length > 0
            ? selectedMuscleGroups.map((group) => group.title).join(" and ")
            : "Exercises";

    const groupedExercises = [
        {
            id: "matching-exercises",
            title: debouncedSearchTerm
                ? `Search results for "${debouncedSearchTerm}"`
                : exerciseGroupTitle,
            exercises,
        },
    ];



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

    if (isLoading && !hasLoadedOnce) {
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
            <div ref={pageTopRef} className={styles.header}>
                <div>
                    <p className={styles.kicker}>Exercise library</p>
                    <h1 className={styles.title}>Select exercises</h1>
                    <p className={styles.subtitle}>
                        Choose exercises for the muscle groups you selected.
                    </p>
                </div>

                <div className={styles.selectedBadge}>
                    {selectedExercises.length} selected
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

            {isLoadingExercises && hasLoadedOnce && (
                <p className={styles.loadingText}>Updating exercises...</p>
            )}

            {actionError && <p className={styles.errorText}>{actionError}</p>}

            <Box className={styles.groupList}>
                {groupedExercises.map((group) => (
                    <section key={group.id} className={styles.exerciseGroup}>
                        <div className={styles.groupHeader}>
                            <h2 className={styles.groupTitle}>{group.title}</h2>
                            <p className={styles.groupCount}>
                                {total} exercises
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
                                                        exercise.secondaryMuscles.length >
                                                        0 && (
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
                                    No matching exercises found.
                                </p>
                            )}
                        </Box>
                    </section>
                ))}
            </Box>

            <div className={styles.footer}>
                <p className={styles.footerText}>
                    {selectedExercises.length === 0
                        ? "Select at least one exercise to continue."
                        : `${selectedExercises.length} exercise${selectedExercises.length === 1 ? "" : "s"
                        } ready.`}
                </p>

                <Button
                    variant="primary"
                    onClick={handleContinue}
                    disabled={selectedExercises.length === 0 || isSavingExercises}
                >
                    {isSavingExercises ? "Saving..." : "Continue"}
                </Button>
            </div>

            {totalPages > 1 && (
                <div className={styles.pagination}>
                    <button
                        type="button"
                        className={styles.pageButton}
                        disabled={page === 1}
                        onClick={() => handlePageChange(page - 1)}
                    >
                        Previous
                    </button>

                    <span className={styles.pageInfo}>
                        Page {page} of {totalPages}
                    </span>

                    <button
                        type="button"
                        className={styles.pageButton}
                        disabled={page === totalPages}
                        onClick={() => handlePageChange(page + 1)}
                    >
                        Next
                    </button>
                </div>
            )}
        </Box>
    );
}