import { ArrowLeft, CheckCircle2 } from "lucide-react";
import Icon from "../../components/ui/icon/Icon";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "../../routes/navigationHooks";

import { useAuth } from "../../context/AuthContext";

import { useQuery, useQueries, keepPreviousData } from "@tanstack/react-query";
import { draftDetailOptions, exerciseDetailOptions, exerciseListOptions } from "../../query/resourceQueries";
import { useDraftMutations } from "../../query/useDraftMutations";

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

import type { Exercise, ExerciseSort } from "@workout-app/shared";

import { usePaginationScroll } from "../../hooks/usePaginationScroll";

type SelectedMuscleGroup = {
    id: string;
    title: string;
};

type WorkoutDraft = {
    _id: string;
    status: "building" | "active" | "completed" | "abandoned";
    selectedMuscleGroups: string[];
    includeCardio?: boolean;
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
    if (muscle === "core") return "Abs";
    return muscle.charAt(0).toUpperCase() + muscle.slice(1);
}

export default function ExerciseSelectPage() {
    const { user } = useAuth();
    const { draftId } = useParams();
    const draft = useQuery(draftDetailOptions(user?._id ?? "", draftId ?? ""));
    if (draft.isPending && draftId) return <LoadingState layout="exercises" className={styles.page} title="Exercise library" message="Loading workout draft and exercises..." />;
    if (!draft.data) return <Box className={styles.page}><div className={styles.stateCard}><h1>Select exercises</h1><p role="alert">{draft.error?.message ?? "Missing workout draft"}</p></div></Box>;
    return <ExerciseSelectionForm key={(user?._id ?? "") + ":" + draftId} initialDraft={draft.data} />;
}

function ExerciseSelectionForm({ initialDraft }: { initialDraft: WorkoutDraft }) {
    const { user, isAuthenticated } = useAuth();
    const draftId = initialDraft._id;
    const navigate = useNavigate();
    const mutations = useDraftMutations(draftId);
    const isSavingExercises = mutations.select.isPending;
    const selectedMuscleGroups: SelectedMuscleGroup[] = initialDraft.selectedMuscleGroups.map(id => ({ id, title: formatMuscleTitle(id) }));
    const includeCardio = initialDraft.includeCardio ?? true;
    const existingExerciseIds = initialDraft.exercises.map(exercise => exercise.exerciseId);
    const isActiveWorkout = initialDraft.status === "active";
    const [selectedExercises, setSelectedExercises] = useState<string[]>(() => isActiveWorkout ? [] : existingExerciseIds);
    const [chosenDetails, setSelectedExerciseDetails] = useState<Exercise[]>([]);
    const detailQueries = useQueries({ queries: [...new Set(existingExerciseIds)].map(id => exerciseDetailOptions(user?._id, id)) });
    const selectedExerciseDetails = [...detailQueries.flatMap(query => query.data ? [query.data] : []), ...chosenDetails];
    const [actionError, setActionError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [sort, setSort] = useState<ExerciseSort>("popular");
    const effectiveSort = sort === "mostUsed" && !isAuthenticated ? "popular" : sort;
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const isCardioOnly = selectedMuscleGroups.length === 0;
    const exercisesQuery = useQuery({
        ...exerciseListOptions(user?._id, {
            sort: effectiveSort, page, limit: 12, search: debouncedSearchTerm,
            ...(isCardioOnly ? { exerciseType: "cardio" as const } : { includeCardio }),
            muscles: isActiveWorkout ? [] : initialDraft.selectedMuscleGroups,
        }),
        placeholderData: keepPreviousData,
    });
    const exercises = exercisesQuery.data?.exercises ?? [];
    const totalPages = exercisesQuery.data?.totalPages ?? 1;
    const { pageTopRef, handlePageChange } = usePaginationScroll<HTMLDivElement>(totalPages, { page, onPageChange: setPage });
    const isLoadingExercises = exercisesQuery.isFetching;
    const isLoading = exercisesQuery.isPending;
    const hasLoadedOnce = !exercisesQuery.isPending;
    const draftError = "";
    const exerciseError = exercisesQuery.error?.message ?? "";
    const error = exerciseError || actionError;
    const isEditingExistingDraft = existingExerciseIds.length > 0;
    useEffect(() => {
        const timeoutId = window.setTimeout(() => { setDebouncedSearchTerm(searchTerm.trim()); setPage(1); }, 300);
        return () => window.clearTimeout(timeoutId);
    }, [searchTerm]);

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

    const exerciseGroupTitle = isCardioOnly ? "Cardio" : isActiveWorkout
        ? "All exercises"
        : selectedMuscleGroups.length > 0
            ? [...selectedMuscleGroups.map((group) => group.title), ...(includeCardio ? ["Cardio"] : [])].join(" and ")
            : "Exercises";

    const currentWorkoutExerciseCards = (() => {
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
    })();

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

        try {
            await mutations.select.mutateAsync({ exerciseIds: selectedExercises, active: isActiveWorkout });
            navigate(isActiveWorkout ? "/workout/" + draftId : "/workout-summary/" + draftId);
        } catch (err) {
            setActionError(
                err instanceof Error
                    ? err.message
                    : "Failed to save selected exercises",
            );
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
                            : isCardioOnly ? "Choose cardio activities for continuous or interval training." : includeCardio ? "Choose exercises for your selected muscles and cardio activities." : "Choose exercises for the muscle groups you selected."}
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
                <label className={styles.searchLabel}>
                    Search exercises
                <input
                    className={styles.searchInput}
                    aria-label="Search exercises"
                    type="search"
                    placeholder="Search exercises, muscles, or equipment..."
                    value={searchTerm}
                    onChange={(event) =>
                        setSearchTerm(event.target.value)
                    }
                />
                </label>
                <label className={styles.sortLabel}>
                    Sort by
                    <select
                        className={styles.sortSelect}
                        value={effectiveSort}
                        onChange={(event) => {
                            setSort(event.target.value as ExerciseSort);
                            setPage(1);
                        }}
                    >
                        <option value="name">Name (A–Z)</option>
                        <option value="popular">Most popular</option>
                        {isAuthenticated && <option value="mostUsed">My most used</option>}
                    </select>
                </label>
                {effectiveSort !== "name" && (
                    <p className={styles.sortHint}>
                        {effectiveSort === "mostUsed"
                            ? "Ranked by your completed workouts, highest to lowest."
                            : "Ranked by completed workouts across all users, highest to lowest."}
                    </p>
                )}
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
