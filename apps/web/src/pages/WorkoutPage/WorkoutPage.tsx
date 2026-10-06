import { Plus, Trash2, Check, Circle, Flag, GripVertical, MoreHorizontal } from "lucide-react";
import Icon from "../../components/ui/icon/Icon";
import {
    useEffect,
    useRef,
    useState,
    type CSSProperties,
} from "react";
import { useNavigate, useParams } from "react-router-dom";

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
    abandonWorkoutDraftRequest,
    completeWorkoutDraftRequest,
    getWorkoutDraftByIdRequest,
    removeWorkoutDraftExerciseRequest,
    reorderWorkoutDraftExercisesRequest,
    updateWorkoutDraftSetsRequest,
} from "../../services/workoutDraftApi";

import { isInaccessibleDraftError, isWorkoutDraftResponse } from "../../utils/restoreSavedWorkout";
import { useAuth } from "../../context/AuthContext";
import { clearWorkoutSnapshot, restoreWorkoutSets, saveWorkoutSets, workoutScope } from "../../utils/workoutProgressStorage";

import styles from "./WorkoutPage.module.css";

type SelectedExercise = {
    _id: string;
    name: string;
};

type WorkoutSet = {
    id: string;
    weight: string;
    reps: string;
    isCompleted: boolean;
};

type DraftSet = {
    id: string;
    weight: number | null;
    reps: number | null;
};

type DraftExercise = {
    exerciseId: string;
    exerciseName: string;
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
    exercise: SelectedExercise;
    exerciseSets: WorkoutSet[];

    onAddSet: (exerciseId: string) => void;

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
};

function SortableWorkoutExerciseCard({
    exercise,
    exerciseSets,
    onAddSet,
    onSetChange,
    onRemoveSet,
    onCompleteSet,
    onRequestRemoveExercise,
    canRemoveExercise,
}: SortableWorkoutExerciseCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        setActivatorNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: exercise._id,
    });

    const cardStyle: CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
        zIndex: isDragging ? 10 : "auto",
    };

    return (
        <section
            ref={setNodeRef}
            style={cardStyle}
            className={`${styles.exerciseCard} ${isDragging
                ? styles.exerciseCardDragging
                : ""
                }`}
        >
            <div className={styles.exerciseHeader}>
                <div className={styles.exerciseTitleRow}>
                    <button
                        type="button"
                        ref={setActivatorNodeRef}
                        className={styles.dragHandle}
                        aria-label={`Reorder ${exercise.name}`}
                        {...attributes}
                        {...listeners}
                    >
                        <Icon icon={GripVertical} />
                    </button>

                    <div>
                        <h2 className={styles.exerciseName}>{exercise.name}</h2>
                        <p className={styles.exerciseProgress}>{exerciseSets.filter(set => set.isCompleted).length} of {exerciseSets.length} sets completed</p>
                    </div>
                </div>

                <div className={styles.exerciseActions}>
                    <Button
                        type="button"
                        variant="primary"
                        size="small"
                        className={styles.addSetButton}
                        icon={Plus}
                        onClick={() =>
                            onAddSet(exercise._id)
                        }
                    >
                        Add set
                    </Button>

                    <details className={styles.exerciseMenu}>
                        <summary
                            className={
                                styles.exerciseMenuButton
                            }
                            aria-label={`Open menu for ${exercise.name}`}
                        >
                            <Icon icon={MoreHorizontal} />
                        </summary>

                        <div
                            className={
                                styles.exerciseMenuDropdown
                            }
                        >
                            <button
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
                                        ? `Remove ${exercise.name}`
                                        : "Add another exercise before removing the final exercise"
                                }
                            >
                                <Icon icon={Trash2} /> Remove exercise
                            </button>
                        </div>
                    </details>
                </div>
            </div>

            <div className={styles.setsList}>
                {exerciseSets.map((set, setIndex) => (
                    <div
                        key={set.id}
                        className={styles.setRow}
                        data-completed={set.isCompleted}
                    >
                        <span className={styles.setCaption}>Set {setIndex + 1}{set.isCompleted ? " - Completed" : ""}</span>
                        <div className={styles.inputGroup}>
                            {(
                                <label
                                    className={
                                        styles.inputLabel
                                    }
                                >
                                    Weight
                                </label>
                            )}

                            <input
                                type="number"
                                min={0}
                                aria-label={`Weight for ${exercise.name}, set ${setIndex + 1}`}
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
                                >
                                    Reps
                                </label>
                            )}

                            <input
                                type="number"
                                min={0}
                                aria-label={`Reps for ${exercise.name}, set ${setIndex + 1}`}
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

                        <Button
                            type="button"
                            variant="ghost"
                            size="small"
                            className={`${styles.completeSetButton
                                } ${set.isCompleted
                                    ? styles.completedSetButton
                                    : ""
                                }`}
                            onClick={() =>
                                onCompleteSet(
                                    exercise._id,
                                    setIndex,
                                )
                            }
                            aria-label={set.isCompleted ? "Completed set; restart rest timer" : "Complete set and start rest timer"}
                            aria-pressed={set.isCompleted}
                        >
                            <Icon icon={set.isCompleted ? Check : Circle} />
                        </Button>

                        <Button
                            type="button"
                            variant="ghost"
                            size="small"
                            className={styles.deleteButton}
                            onClick={() =>
                                onRemoveSet(
                                    exercise._id,
                                    setIndex,
                                )
                            }
                            aria-label="Remove set"
                        >
                            <Icon icon={Trash2} />
                        </Button>
                    </div>
                ))}
            </div>
        </section>
    );
}

export default function WorkoutPage() {
    const { user } = useAuth();
    const { draftId } = useParams();
    if (!user) return null;
    return <ActiveWorkoutPage key={`${user._id}:${draftId}`} userId={user._id} />;
}

function ActiveWorkoutPage({ userId }: { userId: string }) {
    const { draftId } = useParams();
    const navigate = useNavigate();
    const scope = workoutScope(userId, draftId ?? "");
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

    const [error, setError] = useState("");

    const [isAbandoning, setIsAbandoning] = useState(false);
    const [isAbandonModalOpen, setIsAbandonModalOpen] = useState(false);
    const actionRequestPending = useRef(false);

    const [isSaving, setIsSaving] =
        useState(false);
    const isActionPending = isSaving || isAbandoning;

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
            weight: set.weight,
            reps: set.reps,
        }));
    }

    function handleAddSet(exerciseId: string) {
        setHasUserEditedSets(true);

        setSetsByExercise((previousSets) => ({
            ...previousSets,

            [exerciseId]: [
                ...(previousSets[exerciseId] ?? []),

                {
                    id: crypto.randomUUID(),
                    weight: "",
                    reps: "",
                    isCompleted: false,
                },
            ],
        }));
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
                    await getWorkoutDraftByIdRequest(
                        draftId,
                    );

                if (cancelled) return;

                if (!isWorkoutDraftResponse(draft)) {
                    throw new Error("Could not verify this workout. Your saved progress has been kept.");
                }

                if (draft.userId !== userId || draft._id !== draftId) {
                    hasEnded.current = true;
                    clearWorkoutSnapshot(scope);
                    setError("This workout is not accessible to your account.");
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
                            "This workout has already been completed.",
                        );
                    }

                    return;
                }

                if (draft.status === "abandoned") {
                    setError(
                        "This workout draft has been abandoned.",
                    );

                    return;
                }

                setCurrentWorkoutId(draft._id);

                const exercises =
                    draft.exercises.map(
                        (exercise) => ({
                            _id: exercise.exerciseId,
                            name: exercise.exerciseName,
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
                    err instanceof Error
                        ? err.message
                        : "Failed to load workout draft.",
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
            isOpeningExerciseSelect
        ) {
            return;
        }

        const timeoutId = window.setTimeout(
            async () => {
                try {
                    setIsSavingDraft(true);

                    for (const exercise of selectedExercises) {
                        await updateWorkoutDraftSetsRequest(
                            draftId,
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
                        err instanceof Error
                            ? err.message
                            : "Failed to save workout progress.",
                    );
                } finally {
                    setIsSavingDraft(false);
                }
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
    ]);

    async function saveExerciseSets(
        exerciseId: string,
    ) {
        if (!draftId) {
            return;
        }

        setIsSavingDraft(true);

        try {
            await updateWorkoutDraftSetsRequest(
                draftId,
                {
                    exerciseId,

                    sets: toDraftSets(
                        setsByExercise[exerciseId] ??
                        [],
                    ),
                },
            );
        } finally {
            setIsSavingDraft(false);
        }
    }

    async function saveAllExerciseSets() {
        if (!draftId) {
            return;
        }

        setIsSavingDraft(true);

        try {
            for (const exercise of selectedExercises) {
                await updateWorkoutDraftSetsRequest(
                    draftId,
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
            await reorderWorkoutDraftExercisesRequest(
                draftId,
                nextOrder.map(
                    (exercise) => exercise._id,
                ),
            );
        } catch (err) {
            setSelectedExercises(previousOrder);

            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to reorder exercises",
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

        const previousOrder =
            selectedExercises;

        const nextOrder = arrayMove(
            selectedExercises,
            oldIndex,
            newIndex,
        );

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
                "Add weight and reps before completing the set.",
            );

            return;
        }

        try {
            setError("");

            await saveExerciseSets(exerciseId);

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

            resetRestTimer();
            startRestTimer();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to save completed set.",
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
                err instanceof Error
                    ? err.message
                    : "Failed to save the workout before adding an exercise.",
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

            await removeWorkoutDraftExerciseRequest(
                draftId,
                exerciseToRemove._id,
            );

            setSelectedExercises(
                (previousExercises) =>
                    previousExercises.filter(
                        (exercise) =>
                            exercise._id !==
                            exerciseToRemove._id,
                    ),
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
                err instanceof Error
                    ? err.message
                    : "Failed to remove exercise from workout.",
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
            await abandonWorkoutDraftRequest(draftId);
            hasEnded.current = true;
            clearWorkoutSnapshot(scope);
            resetWorkoutTimer();
            resetRestTimer();
            setCurrentWorkoutId(null);
            setIsAbandonModalOpen(false);
            navigate("/workout-select", { replace: true });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to abandon workout. Please try again.");
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
                        !hasCompletedSet(
                            setsByExercise[
                            exercise._id
                            ] ?? [],
                        ),
                );

            if (incompleteExercise) {
                setError(
                    `Add at least one completed set for ${incompleteExercise.name}.`,
                );

                setIsSaving(false);

                return;
            }

            await saveAllExerciseSets();

            const savedWorkoutSession =
                await completeWorkoutDraftRequest(
                    draftId,
                );

            hasEnded.current = true;
            clearWorkoutSnapshot(scope);
            resetWorkoutTimer();
            resetRestTimer();
            setCurrentWorkoutId(null);

            setOpenModal(false);

            navigate(
                `/workout-result/${savedWorkoutSession._id}`,
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to save workout session.",
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
                title="Active workout"
                message="Loading workout..."
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
                                label="Saving..."
                                showLabel
                            />
                        ) : (
                            <><Icon icon={Plus} /> Add exercise</>
                        )}
                    </Button>
                </div>

                <DndContext
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
                            {selectedExercises.map(
                                (exercise) => (
                                    <SortableWorkoutExerciseCard
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
                                    />
                                ),
                            )}
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
                            {error}
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
                    >
                        Abandon Workout
                    </Button>
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
                    >
                        End Workout
                    </Button>
                </div>

                <Modal
                    title={`Remove ${exerciseToRemove?.name ??
                        "exercise"
                        }?`}
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
                                        label="Removing..."
                                        showLabel
                                    />
                                ) : (
                                    "Remove exercise"
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
                            >
                                Cancel
                            </Button>
                        </div>
                    }
                >
                    <p className={styles.modalText}>
                        All sets entered for this
                        exercise will be permanently
                        removed from the active workout.
                    </p>
                    {error && <p className={styles.errorText} role="alert">{error}</p>}
                </Modal>

                <Modal
                    title="Abandon workout?"
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
                                    <LoadingPredator size="small" color="currentColor" label="Abandoning..." showLabel />
                                ) : "Abandon Workout"}
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                size="medium"
                                className={styles.modalSecondaryButton}
                                onClick={handleCloseAbandonModal}
                                disabled={isActionPending}
                            >
                                Cancel
                            </Button>
                        </div>
                    }
                >
                    <p className={styles.modalText}>
                        This workout will be discarded without saving it as a completed session.
                        Are you sure you want to abandon it?
                    </p>
                    {error && <p className={styles.errorText} role="alert">{error}</p>}
                </Modal>

                <Modal
                    title="End session?"
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
                                        label="Saving..."
                                        showLabel
                                    />
                                ) : (
                                    "End Workout"
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
                            >
                                Close
                            </Button>
                        </div>
                    }
                >
                    <p className={styles.modalText}>
                        Are you sure you want to end
                        this workout session?
                    </p>
                    {error && <p className={styles.errorText} role="alert">{error}</p>}
                </Modal>
            </div>
        </div>
    );
}
