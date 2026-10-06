import { ArrowLeft, CheckCircle2 } from "lucide-react";
import Icon from "../../components/ui/icon/Icon";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

import {
    getExerciseByIdRequest,
    getExerciseLibraryRequest,
    getPublicExercisesRequest,
} from "../../services/exerciseApi";

import {
    addWorkoutDraftExercisesRequest,
    getWorkoutDraftByIdRequest,
    updateWorkoutDraftExercisesRequest,
} from "../../services/workoutDraftApi";

import Card from "../../components/ui/cards/Card";
import Box from "../../components/ui/box/Box";
import Button from "../../components/ui/button/Button";
import MuscleDummy from "../../components/muscleDummy/MuscleDummy";
import { LoadingAnnouncement } from "../../components/Loading/Skeleton";
import LoadingState from "../../components/Loading/LoadingState";
import LoadingPredator from "../../components/Loading/LoadingPredator";

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

type ExerciseGroup = {
    id: string;
    title: string;
    count: number;
    exercises: Exercise[];
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

    const [draftStatus, setDraftStatus] = useState<
        WorkoutDraft["status"] | null
    >(null);

    const [existingExerciseIds, setExistingExerciseIds] = useState<string[]>([]);

    const [selectedExercises, setSelectedExercises] = useState<string[]>([]);

    const [selectedExerciseDetails, setSelectedExerciseDetails] = useState<
        Exercise[]
    >([]);

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
    const [totalPages, setTotalPages] = useState(1);

    const { page, setPage, pageTopRef, handlePageChange } =
        usePaginationScroll<HTMLDivElement>(totalPages);

    const isLoading = isLoadingExercises || isLoadingDraft;
    const error = draftError || exerciseError || actionError;

    const isActiveWorkout = draftStatus === "active";

    const selectedMuscleQuery = useMemo(() => {
        return selectedMuscleGroups.map((group) => group.id).join(",");
    }, [selectedMuscleGroups]);

    const isEditingExistingDraft = existingExerciseIds.length > 0;

    useEffect(() => {
        async function loadExercises() {
            if (!isActiveWorkout && !selectedMuscleQuery) {
                return;
            }

            setExerciseError("");
            setIsLoadingExercises(true);

            try {
                const options = {
                    page,
                    limit,
                    search: debouncedSearchTerm,
                    muscles: isActiveWorkout
                        ? []
                        : selectedMuscleQuery.split(","),
                };

                const data = isAuthenticated
                    ? await getExerciseLibraryRequest(options)
                    : await getPublicExercisesRequest(options);

                setExercises(data.exercises);
                setTotalPages(data.totalPages);
            } catch (err) {
                setExerciseError(
                    err instanceof Error
                        ? err.message
                        : "Failed to load exercises",
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
        isActiveWorkout,
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
                const data: WorkoutDraft =
                    await getWorkoutDraftByIdRequest(draftId);

                const draftExerciseIds = data.exercises.map(
                    (exercise) => exercise.exerciseId,
                );

                const uniqueExerciseIds = Array.from(
                    new Set(draftExerciseIds),
                );

                const exerciseResults = await Promise.allSettled(
                    uniqueExerciseIds.map((exerciseId) =>
                        getExerciseByIdRequest(
                            exerciseId,
                            isAuthenticated,
                        ),
                    ),
                );

                const fullExerciseDetails = exerciseResults
                    .filter(
                        (
                            result,
                        ): result is PromiseFulfilledResult<Exercise> =>
                            result.status === "fulfilled",
                    )
                    .map((result) => result.value);

                setDraftStatus(data.status);
                setExistingExerciseIds(draftExerciseIds);

                setSelectedMuscleGroups(
                    data.selectedMuscleGroups.map((muscle) => ({
                        id: muscle,
                        title: formatMuscleTitle(muscle),
                    })),
                );

                setSelectedExercises(
                    data.status === "active" ? [] : draftExerciseIds,
                );

                setSelectedExerciseDetails(fullExerciseDetails);
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
    }, [draftId, navigate, isAuthenticated]);

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

    function handleToggleExercise(exercise: Exercise) {
        if (isSavingExercises) {
            return;
        }

        const isAlreadyInWorkout =
            isActiveWorkout &&
            existingExerciseIds.includes(exercise._id);

        if (isAlreadyInWorkout) {
            return;
        }

        const isAlreadySelected = selectedExercises.includes(
            exercise._id,
        );

        if (isAlreadySelected) {
            setSelectedExercises((previousExercises) =>
                previousExercises.filter(
                    (exerciseId) => exerciseId !== exercise._id,
                ),
            );

            return;
        }

        setSelectedExercises((previousExercises) => [
            ...previousExercises,
            exercise._id,
        ]);

        setSelectedExerciseDetails((previousExercises) => {
            const alreadyExists = previousExercises.some(
                (selectedExercise) =>
                    selectedExercise._id === exercise._id,
            );

            if (alreadyExists) {
                return previousExercises;
            }

            return [...previousExercises, exercise];
        });
    }

    const exerciseGroupTitle = isActiveWorkout
        ? "All exercises"
        : selectedMuscleGroups.length > 0
            ? selectedMuscleGroups
                .map((group) => group.title)
                .join(" and ")
            : "Exercises";

    const currentWorkoutExerciseCards = useMemo(() => {
        const exerciseMap = new Map<string, Exercise>();

        for (const exercise of selectedExerciseDetails) {
            exerciseMap.set(exercise._id, exercise);
        }

        for (const exercise of exercises) {
            if (exerciseMap.has(exercise._id)) {
                exerciseMap.set(exercise._id, exercise);
            }
        }

        const exerciseIdsToShow = isActiveWorkout
            ? [...existingExerciseIds, ...selectedExercises]
            : selectedExercises;

        return exerciseIdsToShow
            .map((exerciseId) => exerciseMap.get(exerciseId))
            .filter(
                (exercise): exercise is Exercise =>
                    Boolean(exercise),
            );
    }, [
        existingExerciseIds,
        exercises,
        isActiveWorkout,
        selectedExerciseDetails,
        selectedExercises,
    ]);

    const hiddenExerciseIds = new Set([
        ...selectedExercises,
        ...(isActiveWorkout ? existingExerciseIds : []),
    ]);
    const availableExercises = exercises.filter(
        (exercise) => !hiddenExerciseIds.has(exercise._id),
    );

    const groupedExercises: ExerciseGroup[] = [
        ...(currentWorkoutExerciseCards.length > 0
            ? [{
                id: "current-workout-exercises",
                title: "Current workout exercises",
                count: currentWorkoutExerciseCards.length,
                exercises: currentWorkoutExerciseCards,
            }]
            : []),
        {
            id: "matching-exercises",
            title: debouncedSearchTerm
                ? `Search results for "${debouncedSearchTerm}"`
                : exerciseGroupTitle,
            count: availableExercises.length,
            exercises: availableExercises,
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
            if (isActiveWorkout) {
                await addWorkoutDraftExercisesRequest(draftId, {
                    exerciseIds: selectedExercises,
                });

                navigate(`/workout/${draftId}`);
                return;
            }

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

    function renderExerciseCard(exercise: Exercise) {
        const isSelected = selectedExercises.includes(exercise._id);

        const isAlreadyInWorkout =
            isActiveWorkout &&
            existingExerciseIds.includes(exercise._id);

        return (
            <Card
                key={exercise._id}
                className={`${styles.exerciseCard} ${isSelected ? styles.selectedCard : ""
                    } ${isAlreadyInWorkout
                        ? styles.existingCard
                        : ""
                    }`}
                onClick={() => handleToggleExercise(exercise)}
                aria-disabled={isAlreadyInWorkout || isSavingExercises}
                aria-pressed={isSelected || isAlreadyInWorkout}
            >
                <div className={styles.exerciseCardContent}>
                    <div className={styles.exerciseCardTop}>
                        <div className={styles.exerciseMainInfo}>
                            <h3 className={styles.exerciseName}>
                                {exercise.name} {(isSelected || isAlreadyInWorkout) && <Icon icon={CheckCircle2} />}
                            </h3>

                            {isAlreadyInWorkout && (
                                <span
                                    className={styles.existingBadge}
                                >
                                    Already added
                                </span>
                            )}

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
                                    exercise.primaryMuscles ?? []
                                }
                                secondaryMuscles={
                                    exercise.secondaryMuscles ?? []
                                }
                            />
                        </div>
                    </div>

                    <div className={styles.muscleInfo}>
                        {exercise.primaryMuscles &&
                            exercise.primaryMuscles.length > 0 && (
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
    }

    if (isLoading && !hasLoadedOnce) {
        return (
            <LoadingState
                layout="exercises"
                className={styles.page}
                title="Exercise library"
                message={
                    isActiveWorkout
                        ? "Loading exercises you can add..."
                        : "Loading workout draft and exercises..."
                }
            />
        );
    }

    if (draftError || (exerciseError && exercises.length === 0)) {
        return (
            <Box className={styles.page}>
                <div className={styles.stateCard}>
                    <p className={styles.kicker}>
                        Exercise library
                    </p>

                    <h1 className={styles.title}>
                        Select exercises
                    </h1>

                    <p className={styles.errorText} role="alert">{error}</p>
                </div>
            </Box>
        );
    }

    return (
        <Box className={styles.page}>
            <div ref={pageTopRef} className={styles.header}>
                <div>
                    <p className={styles.kicker}>
                        Exercise library
                    </p>

                    <h1 className={styles.title}>
                        {isActiveWorkout
                            ? "Add exercises"
                            : isEditingExistingDraft
                                ? "Edit exercises"
                                : "Select exercises"}
                    </h1>

                    <p className={styles.subtitle}>
                        {isActiveWorkout
                            ? "Choose new exercises to add to your active workout."
                            : "Choose exercises for the muscle groups you selected."}
                    </p>

                    <Button
                        type="button"
                        variant="secondary"
                        style={{
                            minWidth: "3.25rem",
                            marginTop: "1.5rem",
                        }}
                        iconOnly
                        className={styles.backButton}
                    aria-label="Go back"
                        onClick={() =>
                            isActiveWorkout
                                ? navigate(
                                    `/workout/${draftId}`,
                                )
                                : navigate(-1)
                        }
                    >
                        <Icon icon={ArrowLeft} />
                    </Button>
                </div>

                <div className={styles.selectedBadge}>
                    {selectedExercises.length}{" "}
                    {isActiveWorkout
                        ? "new selected"
                        : "selected"}
                </div>
            </div>

            <div className={styles.searchWrapper}>
                <input
                    className={styles.searchInput}
                    aria-label="Search exercises"
                    type="text"
                    placeholder="Search exercises, muscles, or equipment..."
                    value={searchTerm}
                    onChange={(event) =>
                        setSearchTerm(event.target.value)
                    }
                />
            </div>

            {isLoadingExercises && hasLoadedOnce && (
                <LoadingAnnouncement message="Updating exercises..." />
            )}

            {exerciseError && <p className={styles.errorText} role="alert">{exerciseError}</p>}

            {actionError && (
                <p className={styles.errorText}>
                    {actionError}
                </p>
            )}

            <Box className={styles.groupList} aria-busy={isLoadingExercises}>
                {groupedExercises.map((group) => (
                    <section
                        key={group.id}
                        className={styles.exerciseGroup}
                    >
                        <div className={styles.groupHeader}>
                            <h2 className={styles.groupTitle}>
                                {group.title}
                            </h2>

                            <p className={styles.groupCount}>
                                {group.count}{" "}
                                {group.count === 1
                                    ? "exercise"
                                    : "exercises"}
                            </p>
                        </div>

                        <Box className={styles.exerciseGrid}>
                            {group.exercises.length > 0 ? (
                                group.exercises.map(
                                    (exercise) =>
                                        renderExerciseCard(
                                            exercise,
                                        ),
                                )
                            ) : (
                                <p className={styles.emptyText}>
                                    {exercises.length > 0
                                        ? "All exercises on this page are already in your workout. Remove one above to select it again, or browse another page."
                                        : "No matching exercises found."}
                                </p>
                            )}
                        </Box>
                    </section>
                ))}
            </Box>

            <div className={styles.footer}>
                <p className={styles.footerText}>
                    {selectedExercises.length === 0
                        ? isActiveWorkout
                            ? "Select at least one new exercise."
                            : "Select at least one exercise to continue."
                        : `${selectedExercises.length} exercise${selectedExercises.length === 1
                            ? ""
                            : "s"
                        } ready.`}
                </p>

                <Button
                    type="button"
                    variant="primary"
                    onClick={handleContinue}
                    disabled={
                        selectedExercises.length === 0 ||
                        isSavingExercises
                    }
                >
                    {isSavingExercises ? (
                        <LoadingPredator
                            size="small"
                            color="currentColor"
                            label={
                                isActiveWorkout
                                    ? "Adding exercises..."
                                    : "Saving..."
                            }
                            showLabel
                        />
                    ) : isActiveWorkout ? (
                        "Add to workout"
                    ) : (
                        "Continue"
                    )}
                </Button>
            </div>

            {totalPages > 1 && (
                <div className={styles.pagination}>
                    <button
                        type="button"
                        className={styles.pageButton}
                        disabled={page === 1}
                        onClick={() =>
                            handlePageChange(page - 1)
                        }
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
                        onClick={() =>
                            handlePageChange(page + 1)
                        }
                    >
                        Next
                    </button>
                </div>
            )}
        </Box>
    );
}
