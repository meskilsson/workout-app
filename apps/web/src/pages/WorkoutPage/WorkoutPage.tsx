import { useWebTimers } from "../../components/timer/WebTimerContext";
import SetOptions from "./SetOptions";
import ExerciseName from "../../components/exercises/ExerciseName";
import { workoutGroups, supersetPairs, restAfterSupersetSet } from "../../utils/workoutGroups";
import useExerciseName from "../../hooks/useExerciseName";
import { translateMessage, t } from "../../i18n";
import { dragAccessibility } from "../../i18n/dragAccessibility";
import { useTranslation } from "react-i18next";
import { friendlyError } from "../../utils/formValidation";
import { useFieldMotion } from "../../components/motion/useFieldMotion";
import { useMotionTransition } from "../../components/motion/useMotionTransition";
import { useReducedMotion } from "../../components/motion/useReducedMotion";
import { CompletedSetRow, SetCompletionControl } from "./SetCompletion";
import { AnimatePresence, motion } from "motion/react";
import { sortableTransition } from "../../components/motion/sortableTransition";
import { useQueryClient } from "@tanstack/react-query";
import { draftDetailOptions } from "../../query/resourceQueries";
import { useDraftMutations } from "../../query/useDraftMutations";
import { finishWorkout } from "../../utils/finishWorkout";
import CardioSession from "../../components/training/CardioSession";
import type { TrainingConfig, CardioCompletion } from "@workout-app/shared";
import { Link2, Unlink, PersonStanding, Plus, Trash2, Flag, GripVertical, MoreHorizontal, ArrowUp, ArrowDown } from "lucide-react";
import Icon from "../../components/ui/icon/Icon";
import {
    useEffect,
    useRef,
    useState,
    type CSSProperties,
} from "react";
import { useNavigate, useParams } from "../../routes/navigationHooks";

import {
    closestCenter,
    DndContext,
    type DragEndEvent,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";

import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

import { isFreshWorkoutTimer, useWorkoutTimer } from "@workout-app/shared/timer";
import { useRestTimerControls } from "@workout-app/shared/timer/rest";
import { useCurrentWorkout } from "@workout-app/shared/currentWorkoutContext";

import Modal from "../../components/ui/modal/Modal";
import Button from "../../components/ui/button/Button";
import WorkoutDurationTimer from "../../components/timer/WorkoutDurationTimer";
import LoadingState from "../../components/Loading/LoadingState";
import LoadingPredator from "../../components/Loading/LoadingPredator";

import {
    completeWorkoutDraftRequest,
} from "../../services/workoutDraftApi";

import { isInaccessibleDraftError, isWorkoutDraftResponse } from "../../utils/restoreSavedWorkout";
import { useAuth } from "../../context/AuthContext";
import { clearWorkoutSnapshot, restoreWorkoutSets, saveWorkoutSets, workoutScope } from "../../utils/workoutProgressStorage";

import styles from "./WorkoutPage.module.css";

type SelectedExercise = {
    supersetId?: string;
    _id: string;
    name: string;
    training?: TrainingConfig;
    cardioCompletion?: CardioCompletion;
};

type WorkoutSet = {
    isWarmup?: boolean;
    id: string;
    weight: string;
    reps: string;
    isCompleted: boolean;
};

type DraftSet = {
    isWarmup?: boolean;
    id: string;
    weight: number | null;
    reps: number | null;
};

type DraftExercise = {
    supersetId?: string;
    exerciseId: string;
    exerciseName: string;
    training?: TrainingConfig;
    cardioCompletion?: CardioCompletion;
    sets: DraftSet[];
};

type WorkoutDraft = {
    userId: string;
    _id: string;
    status: "building" | "active" | "completed" | "abandoned";
    selectedMuscleGroups: string[];
    exercises: DraftExercise[];
    startedAt?: string | null;
    completedSessionId?: string | null;
};

function draftSetToInputSet(set: DraftSet): WorkoutSet {
    return {
        id: set.id,
        isWarmup: set.isWarmup,
        weight: set.weight === null ? "" : String(set.weight),
        reps: set.reps === null ? "" : String(set.reps),
        isCompleted: false,
    };
}

function hasCompletedSet(sets: WorkoutSet[]) {
    return sets.some(
        (set) => set.weight !== "" && set.reps !== "",
    );
}

type SortableWorkoutExerciseCardProps = {
    onSuperset: () => void;
    exercise: SelectedExercise;
    scope: string;
    onTrainingChange: (config: TrainingConfig) => Promise<void>;
    actionsDisabled: boolean;
    exerciseSets: WorkoutSet[];

    onAddSet: (exerciseId: string, isWarmup?: boolean) => void;

    onSetChange: (
        exerciseId: string,
        index: number,
        field: "weight" | "reps",
        value: string,
    ) => void;

    onRemoveSet: (
        exerciseId: string,
        index: number,
    ) => void;

    onCompleteSet: (
        exerciseId: string,
        index: number,
    ) => void;

    onRequestRemoveExercise: (
        exercise: SelectedExercise,
    ) => void;

    canRemoveExercise: boolean;
    canMoveUp: boolean;
    canMoveDown: boolean;
    onMove: (direction: -1 | 1) => void;
};

function SortableWorkoutExerciseCard({
    exercise,
    onSuperset,
    scope, onTrainingChange, actionsDisabled,
    exerciseSets,
    onAddSet,
    onSetChange,
    onRemoveSet,
    onCompleteSet,
    onRequestRemoveExercise,
    canRemoveExercise,
    canMoveUp,
    canMoveDown,
    onMove,
}: SortableWorkoutExerciseCardProps) {
    useTranslation();
    const displayName = useExerciseName(exercise._id, exercise.name);
    const {
        attributes,
        listeners,
        setNodeRef,
        setActivatorNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        attributes: { roleDescription: t("drag.role") },
        id: exercise._id,
    });

    const [expanded, setExpanded] = useState(true);
    const reduced = useReducedMotion();
    const cardCompleted = (!exercise.training || exercise.training.format === "strength")
        && exerciseSets.length > 0 && exerciseSets.every(set => set.isCompleted);
    const fieldMotion = useFieldMotion();
    const timing = useMotionTransition();
    const cardStyle: CSSProperties = {
        opacity: isDragging ? 0.6 : 1,
        zIndex: isDragging ? 10 : "auto",
    };

    return (
        <motion.section
            ref={setNodeRef}
            data-exercise-completed={cardCompleted}
            style={cardStyle}
            initial={false}
            animate={{ transform: CSS.Transform.toString(transform) ?? "none", boxShadow: isDragging ? "var(--shadow-md)" : "var(--shadow-sm)" }}
            transition={{ ...sortableTransition(transition, reduced), boxShadow: { duration: reduced ? 0 : 0.18 } }}
            className={`${styles.exerciseCard} ${isDragging
                ? styles.exerciseCardDragging
                : ""
                }`}
        >
            <motion.span key={String(reduced)} className={styles.exerciseCompletedFill} aria-hidden="true" initial={false}
                animate={{ clipPath: cardCompleted ? "polygon(0% -100%, 200% 100%, 0% 100%)" : "polygon(0% 100%, 0% 100%, 0% 100%)" }}
                transition={{ duration: reduced ? 0 : 0.45, ease: "easeInOut" }} />
            <div className={styles.exerciseHeader}>
                <div className={styles.exerciseTitleRow}>
                    <button
                        type="button"
                        ref={setActivatorNodeRef}
                        className={styles.dragHandle}
                        aria-label={t("common.reorderValue", { value0: displayName })}
                        {...attributes}
                        {...listeners}
                    >
                        <Icon icon={GripVertical} />
                    </button>

                    <div className={styles.exerciseTitleContent}>
                        <h2 className={styles.exerciseName}><button type="button" className={styles.exerciseToggle} aria-expanded={expanded} aria-controls={`sets-${exercise._id}`} onClick={() => setExpanded(value => !value)}>{displayName}<span aria-hidden="true">{expanded ? "\u2212" : "+"}</span></button></h2>
                        {(!exercise.training || exercise.training.format === "strength") && <p className={styles.exerciseProgress}>{exerciseSets.filter(set => set.isCompleted).length} {t("common.of")} {exerciseSets.length} {t("WorkoutPage.setsCompleted")}</p>}
                    </div>
                </div>

                <div className={styles.exerciseActions}>
                    {(!exercise.training || exercise.training.format === "strength") && <Button
                        type="button"
                        variant="primary"
                        size="small"
                        className={styles.addSetButton}
                        icon={Plus}
                        onClick={() => {
                            setExpanded(true);
                            onAddSet(exercise._id);
                        }}
                    > {t("common.addSet")} </Button>}

                    <details className={styles.exerciseMenu}>
                        <motion.summary initial={false} transition={timing}
                            animate={{ color: "var(--color-text-muted)", backgroundColor: "var(--color-surface-soft)", borderColor: "var(--color-border-soft)", boxShadow: "none" }}
                            whileHover={{ color: "var(--color-text)", backgroundColor: "var(--color-primary-soft)", borderColor: "var(--color-primary-border)" }}
                            whileFocus={{ borderColor: "var(--color-primary)", boxShadow: "var(--shadow-focus)" }}
                            className={
                                styles.exerciseMenuButton
                            }
                            aria-label={t("WorkoutPage.openMenuForValue", { value0: displayName })}
                        >
                            <Icon icon={MoreHorizontal} />
                        </motion.summary>

                        <div
                            className={
                                styles.exerciseMenuDropdown
                            }
                        >
                            {(!exercise.training || exercise.training.format === "strength") && <Button type="button" variant="ghost" icon={PersonStanding} disabled={actionsDisabled} onClick={event => {
                                event.currentTarget.closest("details")?.removeAttribute("open");
                                setExpanded(true);
                                onAddSet(exercise._id, true);
                            }}>{t("workout.addWarmup")}</Button>}
                            {(!exercise.training || exercise.training.format === "strength") && <Button type="button" variant="ghost" icon={exercise.supersetId ? Unlink : Link2} disabled={actionsDisabled} onClick={event => {
                                const menu = event.currentTarget.closest("details");
                                menu?.removeAttribute("open");
                                menu?.querySelector("summary")?.focus();
                                onSuperset();
                            }}>{t(exercise.supersetId ? "workout.splitSuperset" : "workout.createSuperset")}</Button>}
                            <Button type="button" variant="ghost" disabled={!canMoveUp} icon={ArrowUp} onClick={() => onMove(-1)}>{t("WorkoutPage.moveUp")}</Button>
                            <Button type="button" variant="ghost" disabled={!canMoveDown} icon={ArrowDown} onClick={() => onMove(1)}>{t("WorkoutPage.moveDown")}</Button>
                            <motion.button initial={false} transition={timing}
                                animate={{ opacity: canRemoveExercise ? 1 : 0.65, color: canRemoveExercise ? "var(--color-danger-text)" : "var(--color-text-muted)", backgroundColor: "transparent" }}
                                whileHover={canRemoveExercise ? { backgroundColor: "var(--color-danger-soft)" } : undefined}
                                type="button"
                                className={
                                    styles.removeExerciseButton
                                }
                                onClick={() =>
                                    onRequestRemoveExercise(
                                        exercise,
                                    )
                                }
                                disabled={!canRemoveExercise}
                                title={
                                    canRemoveExercise
                                        ? t("WorkoutPage.removeValue", { value0: displayName })
                                        : t("WorkoutPage.addAnotherExerciseBeforeRemovingTheFinalExercise")
                                }
                            >
                                <Icon icon={Trash2} /> {t("common.removeExercise")} </motion.button>
                        </div>
                    </details>
                </div>
            </div>

            <motion.div id={`sets-${exercise._id}`} initial={false} animate={{ height: expanded ? "auto" : 0, opacity: expanded ? 1 : 0 }} transition={{ duration: reduced ? 0 : 0.2 }} style={{ overflow: "hidden" }} inert={!expanded}>
            {exercise.training && exercise.training.format !== "strength" ?  <CardioSession key={JSON.stringify(exercise.training)} scope={scope} exerciseId={exercise._id} config={exercise.training} completion={exercise.cardioCompletion} onConfig={onTrainingChange} disabled={actionsDisabled} /> : <div className={styles.setsList}>
                <AnimatePresence initial={false}>
                {exerciseSets.map((set, setIndex) => {
                    const setNumber = exerciseSets.slice(0, setIndex + 1).filter(item => !!item.isWarmup === !!set.isWarmup).length;
                    return <CompletedSetRow key={set.id} completed={set.isCompleted}>
                        <SetCompletionControl completed={set.isCompleted} isWarmup={!!set.isWarmup}
                            number={setNumber}
                            exerciseName={displayName} disabled={actionsDisabled}
                            onComplete={() => onCompleteSet(exercise._id, setIndex)} />
                        <div className={styles.inputGroup}>
                            {(
                                <label
                                    className={
                                        styles.inputLabel
                                    }
                                > {t("WorkoutPage.weight")} </label>
                            )}

                            <motion.input {...fieldMotion(set.id + "-weight", { borderBottomColor: "var(--color-input-border)" }, { borderBottomColor: "var(--color-focus)" })}
                                type="number"
                                min={0}
                                aria-label={set.isWarmup ? t("workout.warmupWeight", { exercise: displayName, number: setNumber }) : t("WorkoutPage.weightForValueSetValue", { value0: displayName, value1: setNumber })}
                                value={set.weight}
                                className={
                                    styles.underlineInput
                                }
                                onChange={(event) =>
                                    onSetChange(
                                        exercise._id,
                                        setIndex,
                                        "weight",
                                        event.target.value,
                                    )
                                }
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            {(
                                <label
                                    className={
                                        styles.inputLabel
                                    }
                                > {t("WorkoutPage.reps")} </label>
                            )}

                            <motion.input {...fieldMotion(set.id + "-reps", { borderBottomColor: "var(--color-input-border)" }, { borderBottomColor: "var(--color-focus)" })}
                                type="number"
                                min={0}
                                aria-label={set.isWarmup ? t("workout.warmupReps", { exercise: displayName, number: setNumber }) : t("WorkoutPage.repsForValueSetValue", { value0: displayName, value1: setNumber })}
                                value={set.reps}
                                className={
                                    styles.underlineInput
                                }
                                onChange={(event) =>
                                    onSetChange(
                                        exercise._id,
                                        setIndex,
                                        "reps",
                                        event.target.value,
                                    )
                                }
                            />
                        </div>


                        <SetOptions disabled={actionsDisabled} canDelete={exerciseSets.length > 1}
                            label={t("workout.setOptions", { number: setNumber, exercise: displayName })}
                            onDelete={() => onRemoveSet(exercise._id, setIndex)} />
                    </CompletedSetRow>;
                })}
                </AnimatePresence>
            </div>}
            </motion.div>
        </motion.section>
    );
}

export default function WorkoutPage() {
    useTranslation();
    const { user } = useAuth();
    const { draftId } = useParams();
    if (!user) return null;
    return <ActiveWorkoutPage key={`${user._id}:${draftId}`} userId={user._id} />;
}

function ActiveWorkoutPage({ userId }: { userId: string }) {
    useTranslation();
    const { draftId } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { supersets: supersetsMutation, sets: setsMutation, training: trainingMutation, reorder: reorderMutation,
        remove: removeMutation, abandon: abandonMutation, complete: completionMutation } = useDraftMutations(draftId ?? "");
    const saveSets = setsMutation.mutateAsync;
    const saveTraining = trainingMutation.mutateAsync;

    const scope = workoutScope(userId, draftId ?? "");
    const webTimers = useWebTimers();
    const hasLoadedDraft = useRef(false);
    const hasEnded = useRef(false);

    const { setCurrentWorkoutId } =
        useCurrentWorkout();

    const {
        state: workoutTimerState,
        start: startWorkoutTimer,
        reset: resetWorkoutTimer,
    } = useWorkoutTimer();

    const {
        start: startRestTimer,
        reset: resetRestTimer,
    } = useRestTimerControls();

    const hasAutoStartedWorkoutTimer =
        useRef(false);

    const [
        selectedExercises,
        setSelectedExercises,
    ] = useState<SelectedExercise[]>([]);

    const exerciseGroups = workoutGroups(selectedExercises);

    const [
        setsByExercise,
        setSetsByExercise,
    ] = useState<Record<string, WorkoutSet[]>>({});

    const [
        isLoadingDraft,
        setIsLoadingDraft,
    ] = useState(true);

    const [, setIsSavingDraft] = useState(false);

    const [
        hasUserEditedSets,
        setHasUserEditedSets,
    ] = useState(false);

    const [openModal, setOpenModal] =
        useState(false);

    const [
        exerciseToRemove,
        setExerciseToRemove,
    ] = useState<SelectedExercise | null>(null);
    const removalName = useExerciseName(exerciseToRemove?._id, exerciseToRemove?.name ?? t("common.exercise"));

    const [error, setError] = useState("");
    const [pairingExercise, setPairingExercise] = useState<SelectedExercise | null>(null);
    const supersetBusy = useRef(false);
    const recentlyCompleted = useRef(new Set<string>());

    const [isAbandoning, setIsAbandoning] = useState(false);
    const [isAbandonModalOpen, setIsAbandonModalOpen] = useState(false);
    const actionRequestPending = useRef(false);
    const autosaveRequest = useRef<Promise<void> | null>(null);

    const [isSaving, setIsSaving] =
        useState(false);
    const isActionPending = isSaving || isAbandoning || trainingMutation.isPending || supersetsMutation.isPending;

    const [
        isRemovingExercise,
        setIsRemovingExercise,
    ] = useState(false);

    const [
        isOpeningExerciseSelect,
        setIsOpeningExerciseSelect,
    ] = useState(false);

    const [
        isReorderingExercises,
        setIsReorderingExercises,
    ] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 30,
            },
        }),

        useSensor(KeyboardSensor, {
            coordinateGetter:
                sortableKeyboardCoordinates,
        }),
    );

    function toDraftSets(sets: WorkoutSet[]) {
        return sets.map((set) => ({
            id: set.id,
        isWarmup: set.isWarmup,
            weight: set.weight,
            reps: set.reps,
        }));
    }

    async function saveSuperset(exercise: SelectedExercise, partner?: SelectedExercise) {
        if (supersetBusy.current || isReorderingExercises || isRemovingExercise || actionRequestPending.current || hasEnded.current) return;
        supersetBusy.current = true;
        try {
            setError("");
            const pairs = supersetPairs(selectedExercises).filter(pair => !pair.includes(exercise._id));
            if (partner) pairs.push([exercise._id, partner._id]);
            const saved: WorkoutDraft = await supersetsMutation.mutateAsync(pairs);
            if (hasEnded.current) return;
            setSelectedExercises(current => current.map(item => ({ ...item, supersetId: saved.exercises.find(savedItem => savedItem.exerciseId === item._id)?.supersetId })));
            setPairingExercise(null);
        } catch (error) { setError(friendlyError(error, t("workout.supersetSaveFailed"))); }
        finally { supersetBusy.current = false; }
    }
    function handleAddSet(exerciseId: string, isWarmup = false) {
        setHasUserEditedSets(true);

        const newSet: WorkoutSet = {
            id: crypto.randomUUID(), weight: "", reps: "", isCompleted: false, isWarmup,
        };
        setSetsByExercise(previousSets => {
            const existing = previousSets[exerciseId] ?? [];
            return {
                ...previousSets,
                [exerciseId]: isWarmup
                    ? [...existing.filter(set => set.isWarmup), newSet, ...existing.filter(set => !set.isWarmup)]
                    : [...existing, newSet],
            };
        });
    }

    useEffect(() => {
        let cancelled = false;
        async function loadDraft() {
            if (!draftId) {
                navigate("/workout-select");
                return;
            }

            try {
                setError("");
                setIsLoadingDraft(true);

                const draft: WorkoutDraft =
                    await queryClient.fetchQuery(draftDetailOptions(userId, draftId));

                if (cancelled) return;

                if (!isWorkoutDraftResponse(draft)) {
                    throw new Error(t("WorkoutPage.couldNotVerifyThisWorkoutYourSavedProgressHas"));
                }

                if (draft.userId !== userId || draft._id !== draftId) {
                    hasEnded.current = true;
                    clearWorkoutSnapshot(scope);
                    setError(t("WorkoutPage.thisWorkoutIsNotAccessibleToYourAccount"));
                    return;
                }

                if (draft.status !== "active") {
                    hasEnded.current = true;
                    clearWorkoutSnapshot(scope);
                    resetRestTimer();
                    setCurrentWorkoutId(null);
                }

                if (draft.status === "building") {
                    navigate(
                        `/workout-summary/${draftId}`,
                    );

                    return;
                }

                if (draft.status === "completed") {
                    if (draft.completedSessionId) {
                        navigate(
                            `/workout-result/${draft.completedSessionId}`,
                        );
                    } else {
                        setError(
                            t("WorkoutPage.thisWorkoutHasAlreadyBeenCompleted"),
                        );
                    }

                    return;
                }

                if (draft.status === "abandoned") {
                    setError(
                        t("WorkoutPage.thisWorkoutDraftHasBeenAbandoned"),
                    );

                    return;
                }

                setCurrentWorkoutId(draft._id);

                const exercises =
                    draft.exercises.map(
                        (exercise) => ({
                            _id: exercise.exerciseId,
                            name: exercise.exerciseName,
                            supersetId: exercise.supersetId,
                            training: exercise.training,
                            cardioCompletion: exercise.cardioCompletion,
                        }),
                    );

                const initialSetsByExercise =
                    draft.exercises.reduce<
                        Record<string, WorkoutSet[]>
                    >((accumulator, exercise) => {
                        accumulator[
                            exercise.exerciseId
                        ] =
                            exercise.sets.length > 0
                                ? exercise.sets.map(
                                    draftSetToInputSet,
                                )
                                : [
                                    {
                                        id: crypto.randomUUID(),
                                        weight: "",
                                        reps: "",
                                        isCompleted:
                                            false,
                                    },
                                ];

                        return accumulator;
                    }, {});

                setSelectedExercises(exercises);
                void webTimers.retainActivities(exercises.filter(exercise => exercise.training && exercise.training.format !== "strength").map(exercise => exercise._id));

                setSetsByExercise(
                    restoreWorkoutSets(scope, initialSetsByExercise),
                );

                hasLoadedDraft.current = true;
                setHasUserEditedSets(false);
            } catch (err) {
                if (cancelled) return;
                if (isInaccessibleDraftError(err)) {
                    hasEnded.current = true;
                    clearWorkoutSnapshot(scope);
                }
                setError(
                    friendlyError(err, t("WorkoutPage.failedToLoadWorkoutDraft")),
                );
            } finally {
                if (!cancelled) setIsLoadingDraft(false);
            }
        }

        void loadDraft();
        return () => { cancelled = true; };
    }, [
        draftId,
        navigate,
        setCurrentWorkoutId,
        scope,
        userId,
        resetRestTimer,
        queryClient,
        webTimers,
    ]);

    useEffect(() => {
        if (
            selectedExercises.length > 0 &&
            !hasAutoStartedWorkoutTimer.current
        ) {
            if (isFreshWorkoutTimer(workoutTimerState)) {
                startWorkoutTimer();
            }

            hasAutoStartedWorkoutTimer.current =
                true;
        }
    }, [
        selectedExercises.length,
        startWorkoutTimer,
        workoutTimerState,
    ]);

    useEffect(() => {
        if (!hasLoadedDraft.current || hasEnded.current) return;
        saveWorkoutSets(scope, setsByExercise);
    }, [scope, setsByExercise]);

    useEffect(() => {
        if (
            !draftId ||
            !hasUserEditedSets ||
            selectedExercises.length === 0 ||
            isRemovingExercise ||
            isOpeningExerciseSelect ||
            isActionPending
        ) {
            return;
        }

        const timeoutId = window.setTimeout(
            async () => {
                if (actionRequestPending.current || hasEnded.current) return;
                const previousSave = autosaveRequest.current;
                const save = (async () => {
                    await previousSave;
                    try {
                        setIsSavingDraft(true);

                        for (const exercise of selectedExercises) {
                            if (actionRequestPending.current || hasEnded.current) break;
                            if (exercise.training && exercise.training.format !== "strength") continue;
                            await saveSets(
                                {
                                    exerciseId:
                                        exercise._id,

                                    sets: toDraftSets(
                                        setsByExercise[
                                        exercise._id
                                        ] ?? [],
                                    ),
                                },
                            );
                        }
                    } catch (err) {
                        setError(
                            friendlyError(err, t("WorkoutPage.failedToSaveWorkoutProgress")),
                        );
                    } finally {
                        setIsSavingDraft(false);
                    }
                })();
                autosaveRequest.current = save;
                await save;
            },
            700,
        );

        return () =>
            window.clearTimeout(timeoutId);
    }, [
        draftId,
        hasUserEditedSets,
        selectedExercises,
        setsByExercise,
        isRemovingExercise,
        isOpeningExerciseSelect,
        isActionPending,
        saveSets,
    ]);

    async function saveExerciseSets(
        exerciseId: string,
    ) {
        if (!draftId) {
            return;
        }

        const previous = autosaveRequest.current;
        const payload = toDraftSets(setsByExercise[exerciseId] ?? []);
        const save = (async () => {
            await previous;
            if (hasEnded.current) return;
            setIsSavingDraft(true);
            try { await saveSets({ exerciseId, sets: payload }); }
            finally { setIsSavingDraft(false); }
        })();
        // Serialize with autosave and final submission. A rejected write must
        // reach its caller without poisoning subsequent retry attempts.
        autosaveRequest.current = save.catch(() => {});
        await save;
    }

    async function saveAllExerciseSets() {
        if (!draftId) {
            return;
        }

        setIsSavingDraft(true);

        try {
            for (const exercise of selectedExercises) {
                if (exercise.training && exercise.training.format !== "strength") {
                    await saveTraining({ exerciseId: exercise._id, training: exercise.training, cardioCompletion: webTimers.completion(exercise._id) });
                    continue;
                }
                await saveSets(
                    {
                        exerciseId: exercise._id,

                        sets: toDraftSets(
                            setsByExercise[
                            exercise._id
                            ] ?? [],
                        ),
                    },
                );
            }
        } finally {
            setIsSavingDraft(false);
        }
    }

    async function saveExerciseOrder(
        nextOrder: SelectedExercise[],
        previousOrder: SelectedExercise[],
    ) {
        if (!draftId) {
            return;
        }

        setIsReorderingExercises(true);
        setError("");

        try {
            await reorderMutation.mutateAsync(
                nextOrder.map(
                    (exercise) => exercise._id,
                ),
            );
        } catch (err) {
            setSelectedExercises(previousOrder);

            setError(
                friendlyError(err, t("common.failedToReorderExercises")),
            );
        } finally {
            setIsReorderingExercises(false);
        }
    }

    function handleDragEnd(
        event: DragEndEvent,
    ) {
        const { active, over } = event;

        if (
            !over ||
            active.id === over.id ||
            isReorderingExercises
        ) {
            return;
        }

        const oldIndex =
            selectedExercises.findIndex(
                (exercise) =>
                    exercise._id === active.id,
            );

        const newIndex =
            selectedExercises.findIndex(
                (exercise) =>
                    exercise._id === over.id,
            );

        if (
            oldIndex === -1 ||
            newIndex === -1
        ) {
            return;
        }

        moveExercise(oldIndex, newIndex);
    }

    function moveExercise(oldIndex: number, newIndex: number) {
        if (isReorderingExercises || newIndex < 0 || newIndex >= selectedExercises.length) return;
        const previousOrder =
            selectedExercises;

        const groups = workoutGroups(selectedExercises);
        const from = groups.findIndex(group => group.some(exercise => exercise._id === selectedExercises[oldIndex]._id));
        const to = groups.findIndex(group => group.some(exercise => exercise._id === selectedExercises[newIndex]._id));
        if (from === to) return;
        if (to < 0 || to >= groups.length) return;
        const nextOrder = arrayMove(groups, from, to).flat();

        setSelectedExercises(nextOrder);

        void saveExerciseOrder(
            nextOrder,
            previousOrder,
        );
    }

    function handleSetChange(
        exerciseId: string,
        index: number,
        field: "weight" | "reps",
        value: string,
    ) {
        const changedSet = setsByExercise[exerciseId]?.[index];
        if (changedSet) recentlyCompleted.current.delete(changedSet.id);
        setHasUserEditedSets(true);

        setSetsByExercise((previousSets) => ({
            ...previousSets,

            [exerciseId]: (
                previousSets[exerciseId] ?? []
            ).map((set, setIndex) =>
                setIndex === index
                    ? {
                        ...set,
                        [field]: value,
                        isCompleted: false,
                    }
                    : set,
            ),
        }));
    }

    function handleRemoveSet(
        exerciseId: string,
        index: number,
    ) {
        const currentSets =
            setsByExercise[exerciseId] ?? [];

        if (currentSets.length <= 1) {
            return;
        }

        setHasUserEditedSets(true);

        setSetsByExercise((previousSets) => ({
            ...previousSets,

            [exerciseId]: currentSets.filter(
                (_, setIndex) =>
                    setIndex !== index,
            ),
        }));
    }

    async function handleCompleteSet(
        exerciseId: string,
        index: number,
    ) {
        const set =
            setsByExercise[exerciseId]?.[index];

        if (
            !set ||
            set.weight === "" ||
            set.reps === ""
        ) {
            setError(
                t("WorkoutPage.addWeightAndRepsBeforeCompletingTheSet"),
            );

            return;
        }

        try {
            setError("");

            setHasUserEditedSets(true);
            setSetsByExercise(
                (previousSets) => ({
                    ...previousSets,

                    [exerciseId]: (
                        previousSets[
                        exerciseId
                        ] ?? []
                    ).map(
                        (
                            currentSet,
                            setIndex,
                        ) =>
                            setIndex === index
                                ? {
                                    ...currentSet,
                                    isCompleted:
                                        true,
                                }
                                : currentSet,
                    ),
                }),
            );

            void webTimers.pauseActivities();
            recentlyCompleted.current.add(set.id);
            if (set.isCompleted || restAfterSupersetSet(selectedExercises, setsByExercise, exerciseId, index, recentlyCompleted.current)) {
                resetRestTimer();
                startRestTimer();
            }
            // Rest starts at the completed set, independently of request latency.
            // Keep local completion on failure; the existing save flow can retry.
            await saveExerciseSets(exerciseId);
        } catch (err) {
            setError(
                friendlyError(err, t("WorkoutPage.failedToSaveCompletedSet")),
            );
        }
    }

    async function handleAddExercise() {
        if (!draftId) {
            navigate("/workout-select");
            return;
        }

        setError("");
        setIsOpeningExerciseSelect(true);

        try {
            if (hasUserEditedSets) {
                await saveAllExerciseSets();
            }

            setHasUserEditedSets(false);

            navigate(
                `/exercise-select/${draftId}`,
            );
        } catch (err) {
            setError(
                friendlyError(err, t("WorkoutPage.failedToSaveTheWorkoutBeforeAddingAnExercise")),
            );

            setIsOpeningExerciseSelect(false);
        }
    }

    function handleRequestRemoveExercise(
        exercise: SelectedExercise,
    ) {
        setError("");
        setExerciseToRemove(exercise);
    }

    function handleCloseRemoveExerciseModal() {
        if (!isRemovingExercise) {
            setExerciseToRemove(null);
        }
    }

    async function handleConfirmRemoveExercise() {
        if (!draftId || !exerciseToRemove) {
            return;
        }

        setError("");
        setIsRemovingExercise(true);

        try {
            if (hasUserEditedSets) {
                await saveAllExerciseSets();
            }

            await removeMutation.mutateAsync(
                exerciseToRemove._id,
            );
            await webTimers.retainActivities(selectedExercises.filter(exercise => exercise._id !== exerciseToRemove._id).map(exercise => exercise._id));

            setSelectedExercises(
                (previousExercises) =>
                    previousExercises.filter(
                        (exercise) =>
                            exercise._id !==
                            exerciseToRemove._id,
                    ).map(exercise => exercise.supersetId === exerciseToRemove.supersetId && exerciseToRemove.supersetId ? { ...exercise, supersetId: undefined } : exercise),
            );

            setSetsByExercise(
                (previousSets) => {
                    const nextSets = {
                        ...previousSets,
                    };

                    delete nextSets[
                        exerciseToRemove._id
                    ];

                    return nextSets;
                },
            );

            setHasUserEditedSets(false);
            setExerciseToRemove(null);
        } catch (err) {
            setError(
                friendlyError(err, t("WorkoutPage.failedToRemoveExerciseFromWorkout")),
            );
        } finally {
            setIsRemovingExercise(false);
        }
    }

    function handleRequestAbandonWorkout() {
        if (actionRequestPending.current) return;
        setError("");
        setIsAbandonModalOpen(true);
    }

    function handleCloseAbandonModal() {
        if (!actionRequestPending.current) setIsAbandonModalOpen(false);
    }

    async function handleConfirmAbandonWorkout() {
        if (!draftId || actionRequestPending.current) return;
        actionRequestPending.current = true;
        setError("");
        setIsAbandoning(true);
        try {
            await abandonMutation.mutateAsync();
            hasEnded.current = true;
            clearWorkoutSnapshot(scope);
            resetWorkoutTimer();
            resetRestTimer();
            setCurrentWorkoutId(null);
            setIsAbandonModalOpen(false);
            navigate("/workout-select", { replace: true });
        } catch (err) {
            setError(friendlyError(err, t("WorkoutPage.failedToAbandonWorkoutPleaseTryAgain")));
        } finally {
            actionRequestPending.current = false;
            setIsAbandoning(false);
        }
    }

    function handleEndSession() {
        if (actionRequestPending.current) return;
        setError("");
        setOpenModal(true);
    }

    function handleCloseModal() {
        if (!actionRequestPending.current) {
            setOpenModal(false);
        }
    }

    async function handleConfirmEndWorkout() {
        if (actionRequestPending.current) return;
        if (!draftId) {
            navigate("/workout-select");
            return;
        }

        setError("");
        actionRequestPending.current = true;
        setIsSaving(true);

        try {
            const incompleteExercise =
                selectedExercises.find(
                    (exercise) =>
                        exercise.training && exercise.training.format !== "strength" ? !webTimers.completion(exercise._id) : !hasCompletedSet(
                            setsByExercise[
                            exercise._id
                            ] ?? [],
                        ),
                );

            if (incompleteExercise) {
                setError(
                    t("WorkoutPage.completeValueBeforeEndingTheWorkout", { value0: incompleteExercise.name }),
                );

                setIsSaving(false);

                return;
            }

            // Drain earlier writes before saving the final values. Never retry a
            // completion blindly: the server may have saved it despite a lost response.
            await autosaveRequest.current;
            const sessionId = await completionMutation.mutateAsync(() => finishWorkout({
                readDraft: () => queryClient.fetchQuery(draftDetailOptions(userId, draftId)),
                save: saveAllExerciseSets,
                complete: () => completeWorkoutDraftRequest(draftId),
            }));
            hasEnded.current = true;
            clearWorkoutSnapshot(scope);
            resetWorkoutTimer();
            resetRestTimer();
            setCurrentWorkoutId(null);

            setOpenModal(false);

            navigate(
                `/workout-result/${sessionId}`,
            );
        } catch (err) {
            setError(
                friendlyError(err, t("WorkoutPage.failedToSaveWorkoutSession")),
            );
        } finally {
            actionRequestPending.current = false;
            setIsSaving(false);
        }
    }

    if (isLoadingDraft) {
        return (
            <LoadingState
                layout="workout"
                className={styles.page}
                title={t("WorkoutPage.activeWorkout")}
                message={t("WorkoutPage.loadingWorkout")}
                color="var(--color-success)"
            />
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <WorkoutDurationTimer />

                <div
                    className={
                        styles.addExerciseWrapper
                    }
                >
                    <Button
                        type="button"
                        variant="secondary"
                        size="medium"
                        onClick={handleAddExercise}
                        disabled={
                            isOpeningExerciseSelect ||
                            isRemovingExercise ||
                            isSaving
                        }
                    >
                        {isOpeningExerciseSelect ? (
                            <LoadingPredator
                                size="small"
                                color="currentColor"
                                label={t("common.saving")}
                                showLabel
                            />
                        ) : (
                            <><Icon icon={Plus} /> {t("common.addExercise")}</>
                        )}
                    </Button>
                </div>

                <Modal title={t("workout.choosePartner")} isOpen={!!pairingExercise} onClose={() => { if (!supersetsMutation.isPending) setPairingExercise(null); }}>
                    <p>{t("workout.supersetHelp")}</p>
                    {error && <p role="alert">{error}</p>}
                    <div className={styles.partnerChoices}>
                        {selectedExercises.filter(exercise => exercise._id !== pairingExercise?._id && !exercise.supersetId && (!exercise.training || exercise.training.format === "strength")).map(exercise =>
                            <Button type="button" variant="secondary" icon={Link2} key={exercise._id} disabled={supersetsMutation.isPending} onClick={() => { if (pairingExercise) void saveSuperset(pairingExercise, exercise); }}>
                                <ExerciseName id={exercise._id} name={exercise.name} />
                            </Button>)}
                        {!selectedExercises.some(exercise => exercise._id !== pairingExercise?._id && !exercise.supersetId && (!exercise.training || exercise.training.format === "strength")) && <p>{t("workout.noPartner")}</p>}
                    </div>
                </Modal>
                <DndContext accessibility={dragAccessibility(selectedExercises.map(exercise => ({ id: exercise._id, name: exercise.name })))}
                    sensors={sensors}
                    collisionDetection={
                        closestCenter
                    }
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={selectedExercises.map(
                            (exercise) =>
                                exercise._id,
                        )}
                        strategy={
                            verticalListSortingStrategy
                        }
                    >
                        <div
                            className={
                                styles.exerciseList
                            }
                        >
                            {exerciseGroups.map((group, groupIndex) => <div key={group[0]._id} className={group.length === 2 ? styles.supersetCard : undefined}>
                                {group.length === 2 && <div className={styles.supersetHeading}><Icon icon={Link2} />{t("workout.superset")}</div>}
                                {group.map(exercise => {
                                    const index = selectedExercises.findIndex(item => item._id === exercise._id);
                                    return <SortableWorkoutExerciseCard
                                        onSuperset={() => { if (exercise.supersetId) void saveSuperset(exercise); else setPairingExercise(exercise); }}
                                        scope={scope}
                                        actionsDisabled={isActionPending || isReorderingExercises || isRemovingExercise}
                                        onTrainingChange={async training => {
                                            if (actionRequestPending.current || hasEnded.current) throw new Error(t("WorkoutPage.theWorkoutIsEndingPleaseWait"));
                                            await saveTraining({ exerciseId: exercise._id, training });
                                            if (hasEnded.current) return;
                                            setSelectedExercises(current => current.map(item => item._id === exercise._id ? { ...item, training, cardioCompletion: undefined } : item));
                                        }}
                                        canMoveUp={groupIndex > 0 && !isActionPending && !isReorderingExercises && !isRemovingExercise}
                                        canMoveDown={groupIndex < exerciseGroups.length - 1 && !isActionPending && !isReorderingExercises && !isRemovingExercise}
                                        onMove={(direction) => {
                                            const target = exerciseGroups[groupIndex + direction]?.[0];
                                            if (target) moveExercise(index, selectedExercises.findIndex(item => item._id === target._id));
                                        }}
                                        key={
                                            exercise._id
                                        }
                                        exercise={
                                            exercise
                                        }
                                        exerciseSets={
                                            setsByExercise[
                                            exercise
                                                ._id
                                            ] ?? []
                                        }
                                        onAddSet={
                                            handleAddSet
                                        }
                                        onSetChange={
                                            handleSetChange
                                        }
                                        onRemoveSet={
                                            handleRemoveSet
                                        }
                                        onCompleteSet={
                                            handleCompleteSet
                                        }
                                        onRequestRemoveExercise={
                                            handleRequestRemoveExercise
                                        }
                                        canRemoveExercise={
                                            selectedExercises.length >
                                            1 &&
                                            !isRemovingExercise
                                        }
                                    />;
                                })}
                            </div>)}
                        </div>
                    </SortableContext>
                </DndContext>

                {error && (
                    <div
                        className={
                            styles.errorWrapper
                        }
                    >
                        <p
                            className={
                                styles.errorText
                            }
                        >
                            {translateMessage(error)}
                        </p>
                    </div>
                )}

                <div
                    className={
                        styles.endSessionWrapper
                    }
                >
                    <Button
                        icon={Trash2}
                        type="button"
                        variant="danger"
                        size="medium"
                        className={styles.endSessionButton}
                        onClick={handleRequestAbandonWorkout}
                        disabled={isActionPending || isRemovingExercise || isOpeningExerciseSelect || selectedExercises.length === 0}
                    > {t("common.abandonWorkout")} </Button>
                    <Button
                        icon={Flag}
                        type="button"
                        variant="success"
                        size="medium"
                        className={
                            styles.endSessionButton
                        }
                        onClick={handleEndSession}
                        disabled={
                            isActionPending ||
                            selectedExercises.length ===
                            0 ||
                            isRemovingExercise ||
                            isOpeningExerciseSelect
                        }
                    > {t("common.endWorkout")} </Button>
                </div>

                <Modal
                    title={t("WorkoutPage.removeValue2", { value0: removalName })}
                    isOpen={
                        exerciseToRemove !== null
                    }
                    onClose={
                        handleCloseRemoveExerciseModal
                    }
                    actions={
                        <div
                            className={
                                styles.modalActions
                            }
                        >
                            <Button
                                type="button"
                                variant="danger"
                                size="medium"
                                className={
                                    styles.modalPrimaryButton
                                }
                                onClick={
                                    handleConfirmRemoveExercise
                                }
                                disabled={
                                    isRemovingExercise
                                }
                            >
                                {isRemovingExercise ? (
                                    <LoadingPredator
                                        size="small"
                                        color="currentColor"
                                        label={t("WorkoutPage.removing")}
                                        showLabel
                                    />
                                ) : (
                                    t("common.removeExercise")
                                )}
                            </Button>

                            <Button
                                type="button"
                                variant="secondary"
                                size="medium"
                                className={
                                    styles.modalSecondaryButton
                                }
                                onClick={
                                    handleCloseRemoveExerciseModal
                                }
                                disabled={
                                    isRemovingExercise
                                }
                            > {t("common.cancel")} </Button>
                        </div>
                    }
                >
                    <p className={styles.modalText}> {t("WorkoutPage.allSetsEnteredForThisExerciseWillBePermanently")} </p>
                    {error && <p className={styles.errorText} role="alert">{translateMessage(error)}</p>}
                </Modal>

                <Modal
                    title={t("WorkoutPage.abandonWorkout")}
                    isOpen={isAbandonModalOpen}
                    onClose={handleCloseAbandonModal}
                    actions={
                        <div className={styles.modalActions}>
                            <Button
                                type="button"
                                variant="danger"
                                size="medium"
                                className={styles.modalPrimaryButton}
                                onClick={handleConfirmAbandonWorkout}
                                disabled={isActionPending}
                            >
                                {isAbandoning ? (
                                    <LoadingPredator size="small" color="currentColor" label={t("WorkoutPage.abandoning")} showLabel />
                                ) : t("common.abandonWorkout")}
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                size="medium"
                                className={styles.modalSecondaryButton}
                                onClick={handleCloseAbandonModal}
                                disabled={isActionPending}
                            > {t("common.cancel")} </Button>
                        </div>
                    }
                >
                    <p className={styles.modalText}> {t("WorkoutPage.thisWorkoutWillBeDiscardedWithoutSavingItAs")} </p>
                    {error && <p className={styles.errorText} role="alert">{translateMessage(error)}</p>}
                </Modal>

                <Modal
                    title={t("WorkoutPage.endSession")}
                    isOpen={openModal}
                    onClose={handleCloseModal}
                    actions={
                        <div
                            className={
                                styles.modalActions
                            }
                        >
                            <Button
                                type="button"
                                variant="success"
                                size="medium"
                                className={
                                    styles.modalPrimaryButton
                                }
                                onClick={
                                    handleConfirmEndWorkout
                                }
                                disabled={isActionPending}
                            >
                                {isSaving ? (
                                    <LoadingPredator
                                        size="small"
                                        color="currentColor"
                                        label={t("common.saving")}
                                        showLabel
                                    />
                                ) : (
                                    t("common.endWorkout")
                                )}
                            </Button>

                            <Button
                                type="button"
                                variant="secondary"
                                size="medium"
                                className={
                                    styles.modalSecondaryButton
                                }
                                onClick={
                                    handleCloseModal
                                }
                                disabled={isActionPending}
                            > {t("common.close")} </Button>
                        </div>
                    }
                >
                    <p className={styles.modalText}> {t("WorkoutPage.areYouSureYouWantToEndThisWorkout")} </p>
                    {error && <p className={styles.errorText} role="alert">{translateMessage(error)}</p>}
                </Modal>
            </div>
        </div>
    );
}
