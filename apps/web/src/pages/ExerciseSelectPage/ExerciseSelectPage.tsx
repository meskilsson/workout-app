import { useExerciseBrowseState } from "../../hooks/useExerciseBrowseState";
import { exerciseText } from "../../i18n/exercises";
import ExerciseSortControl from "../../components/exercises/ExerciseSortControl";
import { translateMessage, displayValue, t } from "../../i18n";
import { useTranslation } from "react-i18next";
import { friendlyError } from "../../utils/formValidation";
import { motion } from "motion/react";
import { useMotionTransition } from "../../components/motion/useMotionTransition";
import { useFieldMotion } from "../../components/motion/useFieldMotion";
import { searchRest, searchFocus, pageButtonRest, pageButtonHover, cardRest, selectedCard } from "../../components/motion/presets";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import Icon from "../../components/ui/icon/Icon";
import { useEffect, useRef, useState } from "react";
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

import type { Exercise } from "@workout-app/shared";

import { usePaginationScroll } from "../../hooks/usePaginationScroll";

type SelectedMuscleGroup = {
    id: string;
    title: string;
};

type WorkoutDraft = {
    _id: string;
    status: "building" | "active" | "completed" | "abandoned";
    purpose: "workout" | "template";
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
    if (muscle === "core") return t("common.abs");
    return displayValue(muscle.charAt(0).toUpperCase() + muscle.slice(1));
}

export default function ExerciseSelectPage() {
    useTranslation();
    const { user } = useAuth();
    const { draftId } = useParams();
    const draft = useQuery(draftDetailOptions(user?._id ?? "", draftId ?? ""));
    if (draft.isPending && draftId) return <LoadingState layout="exercises" className={styles.page} title={t("common.exerciseLibrary")} message={t("common.loadingWorkoutDraftAndExercises")} />;
    if (!draft.data) return <Box className={styles.page}><div className={styles.stateCard}><h1>{t("common.selectExercises")}</h1><p role="alert">{(draft.error ? friendlyError(draft.error, t("common.unableToLoadYourWorkoutPleaseTryAgain")) : t("common.missingWorkoutDraft"))}</p></div></Box>;
    return <ExerciseSelectionForm key={(user?._id ?? "") + ":" + draftId} initialDraft={draft.data} />;
}

function ExerciseSelectionForm({ initialDraft }: { initialDraft: WorkoutDraft }) {
    useTranslation();
    const transition = useMotionTransition();
    const fieldMotion = useFieldMotion();
    const { user, isAuthenticated } = useAuth();
    const draftId = initialDraft._id;
    const navigate = useNavigate();
    const mutations = useDraftMutations(draftId);
    const submitting = useRef(false);
    const isSavingExercises = mutations.select.isPending || mutations.selectAndStart.isPending;
    const isTemplateDraft = initialDraft.purpose === "template";
    const selectedMuscleGroups: SelectedMuscleGroup[] = initialDraft.selectedMuscleGroups.map(id => ({ id, title: formatMuscleTitle(id) }));
    const includeCardio = initialDraft.includeCardio ?? true;
    const existingExerciseIds = initialDraft.exercises.map(exercise => exercise.exerciseId);
    const isActiveWorkout = initialDraft.status === "active";
    const [selectedExercises, setSelectedExercises] = useState<string[]>(() => isActiveWorkout ? [] : existingExerciseIds);
    const [chosenDetails, setSelectedExerciseDetails] = useState<Exercise[]>([]);
    const detailQueries = useQueries({ queries: [...new Set(existingExerciseIds)].map(id => exerciseDetailOptions(user?._id, id)) });
    const selectedExerciseDetails = [...detailQueries.flatMap(query => query.data ? [query.data] : []), ...chosenDetails];
    const [actionError, setActionError] = useState("");
    const browse = useExerciseBrowseState(user?._id, draftId);
    const { search: searchTerm, filters, sort, page, update } = browse;
    const setSearchTerm = (value: string) => update("search", value);
    const setFilters = (value: typeof filters) => update("filters", value);
    const setSort = (value: typeof sort) => update("sort", value);
    const setPage = (value: number | ((previous: number) => number)) => update("page", typeof value === "function" ? value(page) : value);
    const effectiveSort = sort === "mostUsed" && !isAuthenticated ? "popular" : sort;
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm.trim());
    const isCardioOnly = selectedMuscleGroups.length === 0;
    const exercisesQuery = useQuery({
        ...exerciseListOptions(user?._id, {
            ...filters,
            sort: effectiveSort, page, limit: 12, search: debouncedSearchTerm,
            ...(isCardioOnly && !filters.exerciseType ? { exerciseType: "cardio" as const } : { includeCardio: filters.muscles?.length ? false : includeCardio }),
            muscles: filters.muscles?.length ? filters.muscles : isActiveWorkout ? [] : initialDraft.selectedMuscleGroups,
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
    const exerciseError = (exercisesQuery.error ? friendlyError(exercisesQuery.error, t("common.unableToLoadThisContentPleaseTryAgain")) : "");
    const error = exerciseError || actionError;
    const isEditingExistingDraft = existingExerciseIds.length > 0;
    useEffect(() => {
        const timeoutId = window.setTimeout(() => { setDebouncedSearchTerm(searchTerm.trim()); if (searchTerm.trim() !== debouncedSearchTerm) update("page", 1); }, 300);
        return () => window.clearTimeout(timeoutId);
    }, [searchTerm, debouncedSearchTerm, update]);

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

    const exerciseGroupTitle = isCardioOnly ? t("common.cardio") : isActiveWorkout
        ? t("ExerciseSelectPage.allExercises")
        : t("ExerciseSelectPage.matchingExercises");

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
        {
            id: "matching-exercises",
            title: debouncedSearchTerm
                ? t("ExerciseSelectPage.searchResultsForValue", { value0: debouncedSearchTerm })
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

        if (submitting.current) return;
        submitting.current = true;
        setActionError("");

        try {
            if (!isActiveWorkout && !isTemplateDraft) {
                await mutations.selectAndStart.mutateAsync(selectedExercises);
                navigate("/workout/" + draftId);
                return;
            }
            await mutations.select.mutateAsync({ exerciseIds: selectedExercises, active: isActiveWorkout });
            navigate(isActiveWorkout ? "/workout/" + draftId : "/workout-summary/" + draftId);
        } catch (err) {
            setActionError(
                friendlyError(err, t("ExerciseSelectPage.unableToContinuePleaseTryAgain")),
            );
        } finally { submitting.current = false; }
    }

    function renderExerciseCard(exercise: Exercise) {
        const isSelected = selectedExercises.includes(exercise._id);

        const isAlreadyInWorkout =
            isActiveWorkout &&
            existingExerciseIds.includes(exercise._id);

        return (
            <Card
                animate={{ ...(isSelected ? { ...selectedCard, borderColor: "var(--color-border)", boxShadow: "none" } : { ...cardRest, borderColor: "var(--color-border-soft)" }), opacity: isAlreadyInWorkout ? 0.68 : 1 }}
                whileHover={{ borderColor: isAlreadyInWorkout ? "var(--color-border-soft)" : "var(--color-border)", boxShadow: "none" }}
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
                                {exerciseText(exercise)} {(isSelected || isAlreadyInWorkout) && <Icon icon={CheckCircle2} />}
                            </h3>

                            {isAlreadyInWorkout && (
                                <span
                                    className={styles.existingBadge}
                                > {t("ExerciseSelectPage.alreadyAdded")} </span>
                            )}

                            <div className={styles.exerciseMeta}>
                                {exercise.equipment && (
                                    <span>
                                        {displayValue(exercise.equipment)}
                                    </span>
                                )}

                                {exercise.difficulty && (
                                    <span>
                                        {displayValue(exercise.difficulty)}
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
                                    > {t("common.primary")} </p>

                                    <div
                                        className={
                                            styles.muscleTags
                                        }
                                    >
                                        {exercise.primaryMuscles.map(
                                            (muscle) => (
                                                <span
                                                    key={displayValue(muscle)}
                                                    className={
                                                        styles.primaryTag
                                                    }
                                                >
                                                    {displayValue(muscle)}
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
                                    > {t("common.secondary")} </p>

                                    <div
                                        className={
                                            styles.muscleTags
                                        }
                                    >
                                        {exercise.secondaryMuscles.map(
                                            (muscle) => (
                                                <span
                                                    key={displayValue(muscle)}
                                                    className={
                                                        styles.secondaryTag
                                                    }
                                                >
                                                    {displayValue(muscle)}
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
                title={t("common.exerciseLibrary")}
                message={
                    isActiveWorkout
                        ? t("ExerciseSelectPage.loadingExercisesYouCanAdd")
                        : t("common.loadingWorkoutDraftAndExercises")
                }
            />
        );
    }

    if (draftError || (exerciseError && exercises.length === 0)) {
        return (
            <Box className={styles.page}>
                <div className={styles.stateCard}>
                    <h1 className={styles.title}> {t("common.selectExercises")} </h1>

                    <p className={styles.errorText} role="alert">{translateMessage(error)}</p>
                </div>
            </Box>
        );
    }

    return (
        <Box className={styles.page}>
            <div ref={pageTopRef} className={styles.header}>
                    <Button
                        type="button"
                        variant="secondary"
                        iconOnly
                        className={styles.backButton}
                    aria-label={t("common.goBack")}
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
                <div className={styles.headerIntro}>


                    <h1 className={styles.title}>
                        {isActiveWorkout
                            ? t("ExerciseSelectPage.addExercises")
                            : isEditingExistingDraft
                                ? t("ExerciseSelectPage.editExercises")
                                : t("common.selectExercises")}
                    </h1>

                    {(isActiveWorkout || isCardioOnly || includeCardio) && <p className={styles.subtitle}>
                        {isActiveWorkout
                            ? t("ExerciseSelectPage.selectExercisesToAddToYourWorkout")
                            : isCardioOnly ? t("ExerciseSelectPage.chooseYourCardioActivities") : includeCardio ? t("ExerciseSelectPage.chooseExercisesForYourWorkout") : null}
                    </p>}


                </div>


            </div>


            <div className={styles.searchWrapper}>
                <label className={styles.searchLabel}> {t("common.searchExercises")} <motion.input {...fieldMotion("search", { ...searchRest, backgroundColor: "var(--exercise-search-background)" }, { ...searchFocus, backgroundColor: "var(--exercise-search-background)" })}
                    className={styles.searchInput}
                    aria-label={t("common.searchExercises")}
                    type="search"
                    placeholder={t("ExerciseSelectPage.searchExercisesMusclesOrEquipment")}
                    value={searchTerm}
                    onChange={(event) =>
                        setSearchTerm(event.target.value)
                    }
                />
                </label>
                <ExerciseSortControl filters={filters} onFiltersChange={value => { setFilters(value); setPage(1); }} value={effectiveSort} authenticated={isAuthenticated}
                    onChange={value => { setSort(value); setPage(1); }} />
            </div>

            {isLoadingExercises && hasLoadedOnce && (
                <LoadingAnnouncement message={t("common.updatingExercises")} />
            )}

            {exerciseError && <p className={styles.errorText} role="alert">{translateMessage(exerciseError)}</p>}

            {actionError && (
                <p className={styles.errorText}>
                    {translateMessage(actionError)}
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
                                {t("common.exerciseCount", { count: group.count })}
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
                                        ? t("ExerciseSelectPage.yourChosenExercisesAreListedBelowBrowseAnotherPage")
                                        : t("ExerciseSelectPage.noMatchingExercisesFound")}
                                </p>
                            )}
                        </Box>
                    </section>
                ))}
            </Box>

            {totalPages > 1 && (
                <div className={styles.pagination}>
                    <motion.button initial={false} transition={transition}
                        animate={{ ...pageButtonRest, opacity: (page === 1) ? 0.45 : 1 }}
                        whileHover={(page === 1) ? undefined : pageButtonHover}
                        type="button"
                        className={styles.pageButton}
                        disabled={page === 1}
                        onClick={() =>
                            handlePageChange(page - 1)
                        }
                    > {t("common.previous")} </motion.button>

                    <span className={styles.pageInfo}> {t("common.page")} {page} {t("common.of")} {totalPages}
                    </span>

                    <motion.button initial={false} transition={transition}
                        animate={{ ...pageButtonRest, opacity: (page === totalPages) ? 0.45 : 1 }}
                        whileHover={(page === totalPages) ? undefined : pageButtonHover}
                        type="button"
                        className={styles.pageButton}
                        disabled={page === totalPages}
                        onClick={() =>
                            handlePageChange(page + 1)
                        }
                    > {t("common.next")} </motion.button>
                </div>
            )}
            {currentWorkoutExerciseCards.length > 0 && (
                <section className={`${styles.groupList} ${styles.exerciseGroup}`} aria-labelledby="chosen-exercises-heading">
                    <div className={styles.groupHeader}>
                        <h2 id="chosen-exercises-heading" className={styles.groupTitle}>
                            {isActiveWorkout ? t("ExerciseSelectPage.workoutExercises") : t("ExerciseSelectPage.chosenExercises")}
                        </h2>
                        <p className={styles.groupCount}>{t("common.exerciseCount", { count: currentWorkoutExerciseCards.length })}</p>
                    </div>
                    <div className={styles.exerciseGrid}>
                        {currentWorkoutExerciseCards.map(renderExerciseCard)}
                    </div>
                </section>
            )}

            <div className={styles.footer}>
                <p className={styles.footerText}>
                    {selectedExercises.length === 0
                        ? isActiveWorkout
                            ? t("ExerciseSelectPage.selectAtLeastOneNewExercise")
                            : t("ExerciseSelectPage.selectAtLeastOneExerciseToContinue")
                        : t("common.exercisesReady", { count: selectedExercises.length })}
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
                                    ? t("ExerciseSelectPage.addingExercises")
                                    : isTemplateDraft ? t("common.saving") : t("common.starting")
                            }
                            showLabel
                        />
                    ) : isActiveWorkout ? (
                        t("ExerciseSelectPage.addToWorkout")
                    ) : (
                        isTemplateDraft ? t("ExerciseSelectPage.reviewTemplate") : t("common.startWorkout")
                    )}
                </Button>
            </div>

        </Box>
    );
}
