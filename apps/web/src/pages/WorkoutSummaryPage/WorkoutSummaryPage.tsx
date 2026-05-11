import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Box from "../../components/ui/box/Box";
import Card from "../../components/ui/cards/Card";
import Button from "../../components/ui/button/Button";
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

import {
  getWorkoutDraftByIdRequest,
  startWorkoutDraftRequest,
  reorderWorkoutDraftExercisesRequest,
} from "../../services/workoutDraftApi";

import styles from "./WorkoutSummaryPage.module.css";

type DraftExercise = {
  exerciseId: string;
  exerciseName: string;
  sets: {
    weight: number | null;
    reps: number | null;
  }[];
};

type WorkoutDraft = {
  _id: string;
  status: "building" | "active" | "completed" | "abandoned";
  selectedMuscleGroups: string[];
  exercises: DraftExercise[];
};

type SortableSummaryExerciseCardProps = {
  exercise: DraftExercise;
  index: number;
};

function SortableSummaryExerciseCard({
  exercise,
  index,
}: SortableSummaryExerciseCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: exercise.exerciseId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 10 : "auto",
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        touchAction: "none",
      }}
      {...attributes}
      {...listeners}
    >
      <Card className={styles.exerciseCard}>
        <div className={styles.exerciseHeader}>
          <div>
            <p className={styles.exerciseNumber}>Exercise {index + 1}</p>

            <h3 className={styles.exerciseTitle}>
              {exercise.exerciseName}
            </h3>
          </div>

          <span className={styles.exerciseBadge}>Selected</span>
        </div>
      </Card>
    </div>
  );
}

export default function WorkoutSummaryPage() {
  const { draftId } = useParams();
  const navigate = useNavigate();

  const [draft, setDraft] = useState<WorkoutDraft | null>(null);
  const [isLoadingDraft, setIsLoadingDraft] = useState(true);
  const [isStartingWorkout, setIsStartingWorkout] = useState(false);
  const [orderedExercises, setOrderedExercises] = useState<DraftExercise[]>([]);
  const [isReordering, setIsReordering] = useState(false);
  const [error, setError] = useState("");

  const selectedExercises = orderedExercises;
  const totalExercises = selectedExercises.length;

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

  useEffect(() => {
    async function loadDraft() {
      if (!draftId) {
        navigate("/workout-select");
        return;
      }

      try {
        setError("");
        setIsLoadingDraft(true);

        const data: WorkoutDraft = await getWorkoutDraftByIdRequest(draftId);

        setDraft(data);
        setOrderedExercises(data.exercises);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load workout draft",
        );
      } finally {
        setIsLoadingDraft(false);
      }
    }

    loadDraft();
  }, [draftId, navigate]);


  async function saveExerciseOrder(
    nextOrder: DraftExercise[],
    previousOrder: DraftExercise[],
  ) {
    if (!draftId) {
      return;
    }

    setIsReordering(true);
    setError("");

    try {
      await reorderWorkoutDraftExercisesRequest(
        draftId,
        nextOrder.map((exercise) => exercise.exerciseId),
      );
    } catch (err) {
      setOrderedExercises(previousOrder);
      setError(
        err instanceof Error ? err.message : "Failed to reorder exercises",
      );
    } finally {
      setIsReordering(false);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id || isReordering) {
      return;
    }

    const oldIndex = orderedExercises.findIndex(
      (exercise) => exercise.exerciseId === active.id,
    );

    const newIndex = orderedExercises.findIndex(
      (exercise) => exercise.exerciseId === over.id,
    );

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const previousOrder = orderedExercises;
    const nextOrder = arrayMove(orderedExercises, oldIndex, newIndex);

    setOrderedExercises(nextOrder);
    void saveExerciseOrder(nextOrder, previousOrder);
  }

  async function handleContinue() {
    if (!draftId) {
      navigate("/workout-select");
      return;
    }

    try {
      setError("");
      setIsStartingWorkout(true);

      await startWorkoutDraftRequest(draftId);

      navigate(`/workout/${draftId}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to start workout",
      );
    } finally {
      setIsStartingWorkout(false);
    }
  }

  function handleBack() {
    if (draftId) {
      navigate(`/exercise-select/${draftId}`);
      return;
    }

    navigate("/workout-select");
  }

  if (isLoadingDraft) {
    return (
      <Box className={styles.page}>
        <Card className={styles.stateCard}>
          <p className={styles.kicker}>Workout builder</p>
          <h1 className={styles.title}>Workout summary</h1>
          <p className={styles.stateText}>Loading workout summary...</p>
        </Card>
      </Box>
    );
  }

  if (error) {
    return (
      <Box className={styles.page}>
        <Card className={styles.stateCard}>
          <p className={styles.kicker}>Workout builder</p>
          <h1 className={styles.title}>Workout summary</h1>
          <p className={styles.stateText}>{error}</p>

          <Button type="button" variant="secondary" onClick={handleBack}>
            Go back
          </Button>
        </Card>
      </Box>
    );
  }

  return (
    <Box className={styles.page}>
      <div className={styles.header}>
        <div>
          <p className={styles.kicker}>Workout builder</p>
          <h1 className={styles.title}>Workout summary</h1>
          <p className={styles.subtitle}>
            Review your selected exercises before starting your session.
          </p>
        </div>

        <Button type="button" variant="secondary" onClick={handleBack}>
          Back
        </Button>
      </div>

      <Card className={styles.summaryCard}>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Exercises</span>
            <span className={styles.summaryValue}>{totalExercises}</span>
          </div>

          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Status</span>
            <span className={styles.summaryValue}>
              {totalExercises > 0 ? "Ready" : "Incomplete"}
            </span>
          </div>
        </div>
      </Card>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Selected exercises</h2>
            <p className={styles.sectionText}>
              These exercises will be included in your workout session. <br />
              Drag and drop to re-order exercises.
            </p>
          </div>
        </div>

        {selectedExercises.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={selectedExercises.map((exercise) => exercise.exerciseId)}
              strategy={verticalListSortingStrategy}
            >
              <div className={styles.exerciseList}>
                {selectedExercises.map((exercise, index) => (
                  <SortableSummaryExerciseCard
                    key={exercise.exerciseId}
                    exercise={exercise}
                    index={index}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <Card className={styles.stateCard}>
            <p className={styles.stateText}>
              No exercises selected yet. Go back and choose at least one
              exercise.
            </p>
          </Card>
        )}
      </section>

      <div className={styles.footer}>
        <p className={styles.footerText}>
          {selectedExercises.length === 0
            ? "Choose exercises before starting."
            : `${selectedExercises.length} exercise${selectedExercises.length === 1 ? "" : "s"
            } ready.`}
        </p>

        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={handleBack}>
            Back
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={handleContinue}
            disabled={selectedExercises.length === 0 || isStartingWorkout}
          >
            {isStartingWorkout ? "Starting..." : "Start workout"}
          </Button>
        </div>
      </div>
    </Box>
  );
}