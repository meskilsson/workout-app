import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Modal from "../../components/ui/modal/Modal";
import Button from "../../components/ui/button/Button";
import WorkoutDurationTimer from "../../components/timer/WorkoutDurationTimer";

import {
    completeWorkoutDraftRequest,
    getWorkoutDraftByIdRequest,
    updateWorkoutDraftSetsRequest,
    reorderWorkoutDraftExercisesRequest
} from "../../services/workoutDraftApi";

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

import { useWorkoutTimer } from "@workout-app/shared/timer";
import { useRestTimerControls } from "@workout-app/shared/timer/rest";
import { useCurrentWorkout } from "@workout-app/shared/currentWorkoutContext";

import styles from "./WorkoutPage.module.css";

type SelectedExercise = {
    _id: string;
    name: string;
};

type WorkoutSet = {
    weight: string;
    reps: string;
};

type DraftSet = {
    weight: number | null;
    reps: number | null;
};

type DraftExercise = {
    exerciseId: string;
    exerciseName: string;
    sets: DraftSet[];
};

type WorkoutDraft = {
    _id: string;
    status: "building" | "active" | "completed" | "abandoned";
    selectedMuscleGroups: string[];
    exercises: DraftExercise[];
    startedAt?: string | null;
    completedSessionId?: string | null;
};

function draftSetToInputSet(set: DraftSet): WorkoutSet {
    return {
        weight: set.weight === null ? "" : String(set.weight),
        reps: set.reps === null ? "" : String(set.reps),
    };
}

function hasCompletedSet(sets: WorkoutSet[]) {
    return sets.some((set) => set.weight !== "" && set.reps !== "");
}

type SortableWorkoutExerciseCardProps = {
    exercise: SelectedExercise;
    index: number;
    exerciseSets: WorkoutSet[];
    onAddSet: (exerciseId: string) => void;
    onSetChange: (
        exerciseId: string,
        index: number,
        field: "weight" | "reps",
        value: string,
    ) => void;
    onRemoveSet: (exerciseId: string, index: number) => void;
    onCompleteSet: (exerciseId: string, index: number) => void;
};

function SortableWorkoutExerciseCard({
    exercise,
    index,
    exerciseSets,
    onAddSet,
    onSetChange,
    onRemoveSet,
    onCompleteSet,
}: SortableWorkoutExerciseCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: exercise._id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
        zIndex: isDragging ? 10 : "auto",
    };

    return (
        <section
            ref={setNodeRef}
            style={{
                ...style,
                touchAction: "none",
            }}
            className={styles.exerciseCard}
            {...attributes}
            {...listeners}
        >
            <div className={styles.exerciseHeader}>
                <div className={styles.exerciseTitleRow}>
                    <h2 className={styles.exerciseName}>{exercise.name}</h2>
                </div>

                <Button
                    type="button"
                    variant="primary"
                    size="small"
                    className={styles.addSetButton}
                    onClick={() => onAddSet(exercise._id)}
                >
                    Add set
                </Button>
            </div>

            <div className={styles.setsList}>
                {exerciseSets.map((set, setIndex) => (
                    <div key={setIndex} className={styles.setRow}>
                        <div className={styles.inputGroup}>
                            {setIndex === 0 && (
                                <label className={styles.inputLabel}>
                                    Weight
                                </label>
                            )}

                            <input
                                type="number"
                                min={0}
                                value={set.weight}
                                className={styles.underlineInput}
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
                            {setIndex === 0 && (
                                <label className={styles.inputLabel}>
                                    Reps
                                </label>
                            )}

                            <input
                                type="number"
                                min={0}
                                value={set.reps}
                                className={styles.underlineInput}
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
                            className={styles.completeSetButton}
                            onClick={() => onCompleteSet(exercise._id, setIndex)}
                            aria-label="Complete set and start rest timer"
                        >
                            ✓
                        </Button>

                        <Button
                            type="button"
                            variant="ghost"
                            size="small"
                            className={styles.deleteButton}
                            onClick={() => onRemoveSet(exercise._id, setIndex)}
                            aria-label="Remove set"
                        >
                            X
                        </Button>
                    </div>
                ))}
            </div>
        </section>
    );
}

export default function WorkoutPage() {
    const { draftId } = useParams();
    const navigate = useNavigate();
    const { setCurrentWorkoutId } = useCurrentWorkout();

    const {
        start: startWorkoutTimer,
        reset: resetWorkoutTimer,
    } = useWorkoutTimer();

    const {
        start: startRestTimer,
        reset: resetRestTimer,
    } = useRestTimerControls();


    const hasAutoStartedWorkoutTimer = useRef(false);

    const [selectedExercises, setSelectedExercises] = useState<SelectedExercise[]>(
        [],
    );
    const [setsByExercise, setSetsByExercise] = useState<
        Record<string, WorkoutSet[]>
    >({});

    const [isLoadingDraft, setIsLoadingDraft] = useState(true);
    const [isSavingDraft, setIsSavingDraft] = useState(false);
    const [hasUserEditedSets, setHasUserEditedSets] = useState(false);

    const [openModal, setOpenModal] = useState(false);
    const [error, setError] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isReorderingExercises, setIsReorderingExercises] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    function handleAddSet(exerciseId: string) {
        setHasUserEditedSets(true);

        setSetsByExercise((prev) => ({
            ...prev,
            [exerciseId]: [...(prev[exerciseId] ?? []), { weight: "", reps: "" }],
        }));
    }

    useEffect(() => {
        async function loadDraft() {
            if (!draftId) {
                navigate("/workout-select");
                return;
            }

            try {
                setError("");
                setIsLoadingDraft(true);

                const draft: WorkoutDraft = await getWorkoutDraftByIdRequest(draftId);

                if (draft.status === "building") {
                    navigate(`/workout-summary/${draftId}`);
                    return;
                }

                if (draft.status === "completed" && draft.completedSessionId) {
                    navigate(`/workout-result/${draft.completedSessionId}`);
                    return;
                }

                if (draft.status === "abandoned") {
                    setError("This workout draft has been abandoned.");
                    return;
                }

                setCurrentWorkoutId(draft._id);

                const exercises = draft.exercises.map((exercise) => ({
                    _id: exercise.exerciseId,
                    name: exercise.exerciseName,
                }));


                const initialSetsByExercise = draft.exercises.reduce<
                    Record<string, WorkoutSet[]>
                >((acc, exercise) => {
                    acc[exercise.exerciseId] =
                        exercise.sets.length > 0
                            ? exercise.sets.map(draftSetToInputSet)
                            : [{ weight: "", reps: "" }];

                    return acc;
                }, {});

                setSelectedExercises(exercises);
                setSetsByExercise(initialSetsByExercise);
            } catch (err) {
                setError(
                    err instanceof Error ? err.message : "Failed to load workout draft.",
                );
            } finally {
                setIsLoadingDraft(false);
            }
        }

        loadDraft();
    }, [draftId, navigate, setCurrentWorkoutId]);

    useEffect(() => {
        if (
            selectedExercises.length > 0 &&
            !hasAutoStartedWorkoutTimer.current
        ) {
            startWorkoutTimer();
            hasAutoStartedWorkoutTimer.current = true;
        }
    }, [selectedExercises.length, startWorkoutTimer]);

    useEffect(() => {
        if (!draftId || !hasUserEditedSets || selectedExercises.length === 0) {
            return;
        }

        const timeoutId = window.setTimeout(async () => {
            try {
                setIsSavingDraft(true);

                for (const exercise of selectedExercises) {
                    await updateWorkoutDraftSetsRequest(draftId, {
                        exerciseId: exercise._id,
                        sets: setsByExercise[exercise._id] ?? [],
                    });
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
        }, 700);

        return () => window.clearTimeout(timeoutId);
    }, [draftId, hasUserEditedSets, selectedExercises, setsByExercise]);

    async function saveExerciseSets(exerciseId: string) {
        if (!draftId) {
            return;
        }

        setIsSavingDraft(true);

        try {
            await updateWorkoutDraftSetsRequest(draftId, {
                exerciseId,
                sets: setsByExercise[exerciseId] ?? [],
            });
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
                await updateWorkoutDraftSetsRequest(draftId, {
                    exerciseId: exercise._id,
                    sets: setsByExercise[exercise._id] ?? [],
                });
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
                nextOrder.map((exercise) => exercise._id),
            );
        } catch (err) {
            setSelectedExercises(previousOrder);
            setError(
                err instanceof Error ? err.message : "Failed to reorder exercises",
            );
        } finally {
            setIsReorderingExercises(false);
        }
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (!over || active.id === over.id || isReorderingExercises) {
            return;
        }

        const oldIndex = selectedExercises.findIndex(
            (exercise) => exercise._id === active.id,
        );

        const newIndex = selectedExercises.findIndex(
            (exercise) => exercise._id === over.id,
        );

        if (oldIndex === -1 || newIndex === -1) {
            return;
        }

        const previousOrder = selectedExercises;
        const nextOrder = arrayMove(selectedExercises, oldIndex, newIndex);

        setSelectedExercises(nextOrder);
        void saveExerciseOrder(nextOrder, previousOrder);
    }

    function handleSetChange(
        exerciseId: string,
        index: number,
        field: "weight" | "reps",
        value: string,
    ) {
        setHasUserEditedSets(true);

        setSetsByExercise((prev) => ({
            ...prev,
            [exerciseId]: (prev[exerciseId] ?? []).map((set, i) =>
                i === index ? { ...set, [field]: value } : set,
            ),
        }));
    }

    function handleRemoveSet(exerciseId: string, index: number) {
        const currentSets = setsByExercise[exerciseId] ?? [];

        if (currentSets.length <= 1) {
            return;
        }

        setHasUserEditedSets(true);

        setSetsByExercise((prev) => ({
            ...prev,
            [exerciseId]: currentSets.filter((_, i) => i !== index),
        }));
    }

    async function handleCompleteSet(exerciseId: string, index: number) {
        const set = setsByExercise[exerciseId]?.[index];

        if (!set || set.weight === "" || set.reps === "") {
            setError("Add weight and reps before completing the set.");
            return;
        }

        try {
            setError("");
            await saveExerciseSets(exerciseId);
            startRestTimer();
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to save completed set.",
            );
        }
    }

    function handleEndSession() {
        setError("");
        setOpenModal(true);
    }

    function handleCloseModal() {
        if (!isSaving) {
            setOpenModal(false);
        }
    }

    async function handleConfirmEndWorkout() {
        if (!draftId) {
            navigate("/workout-select");
            return;
        }

        setError("");
        setIsSaving(true);

        try {
            const incompleteExercise = selectedExercises.find(
                (exercise) => !hasCompletedSet(setsByExercise[exercise._id] ?? []),
            );

            if (incompleteExercise) {
                setError(
                    `Add at least one completed set for ${incompleteExercise.name}.`,
                );
                setIsSaving(false);
                return;
            }

            await saveAllExerciseSets();

            const savedWorkoutSession = await completeWorkoutDraftRequest(draftId);


            resetWorkoutTimer();
            resetRestTimer();
            setCurrentWorkoutId(null);

            setOpenModal(false);

            navigate(`/workout-result/${savedWorkoutSession._id}`);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to save workout session.",
            );
        } finally {
            setIsSaving(false);
        }
    }

    if (isLoadingDraft) {
        return (
            <div className={styles.page}>
                <div className={styles.container}>
                    <p className={styles.errorText}>Loading workout...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <WorkoutDurationTimer />

                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={selectedExercises.map((exercise) => exercise._id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className={styles.exerciseList}>
                            {selectedExercises.map((exercise, index) => (
                                <SortableWorkoutExerciseCard
                                    key={exercise._id}
                                    exercise={exercise}
                                    index={index}
                                    exerciseSets={setsByExercise[exercise._id] ?? []}
                                    onAddSet={handleAddSet}
                                    onSetChange={handleSetChange}
                                    onRemoveSet={handleRemoveSet}
                                    onCompleteSet={handleCompleteSet}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>

                {error && (
                    <div className={styles.errorWrapper}>
                        <p className={styles.errorText}>{error}</p>
                    </div>
                )}

                <div className={styles.endSessionWrapper}>
                    <Button
                        type="button"
                        variant="danger"
                        size="medium"
                        className={styles.endSessionButton}
                        onClick={handleEndSession}
                        disabled={selectedExercises.length === 0}
                    >
                        End Session
                    </Button>
                </div>

                <Modal
                    title="End session?"
                    isOpen={openModal}
                    onClose={handleCloseModal}
                    actions={
                        <div className={styles.modalActions}>
                            <Button
                                type="button"
                                variant="danger"
                                size="medium"
                                className={styles.modalPrimaryButton}
                                onClick={handleConfirmEndWorkout}
                                disabled={isSaving}
                            >
                                {isSaving ? "Saving..." : "End Workout"}
                            </Button>

                            <Button
                                type="button"
                                variant="secondary"
                                size="medium"
                                className={styles.modalSecondaryButton}
                                onClick={handleCloseModal}
                                disabled={isSaving}
                            >
                                Close
                            </Button>
                        </div>
                    }
                >
                    <p className={styles.modalText}>
                        Are you sure you want to end this workout session?
                    </p>
                </Modal>
            </div>
        </div>
    );
}