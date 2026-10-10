import { draftDetailOptions } from "../../query/resourceQueries";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { authKey, templateKeys } from "../../query/queryClient";
import TrainingConfigForm from "../../components/training/TrainingConfigForm";
import type { TrainingConfig } from "@workout-app/shared";
import { ArrowLeft, ArrowUp, ArrowDown, GripVertical } from "lucide-react";
import Icon from "../../components/ui/icon/Icon";
import { useState, type FormEvent } from "react";
import { useNavigate, useParams } from "../../routes/navigationHooks";

import Box from "../../components/ui/box/Box";
import Card from "../../components/ui/cards/Card";
import Button from "../../components/ui/button/Button";
import Modal from "../../components/ui/modal/Modal";
import LoadingState from "../../components/Loading/LoadingState";
import LoadingPredator from "../../components/Loading/LoadingPredator";

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
  updateWorkoutDraftTrainingRequest,
  startWorkoutDraftRequest,
  reorderWorkoutDraftExercisesRequest,
} from "../../services/workoutDraftApi";

import { createWorkoutTemplateFromDraftRequest } from "../../services/workoutTemplateApi";

import type { WorkoutTemplateCategory } from "@workout-app/shared";

import styles from "./WorkoutSummaryPage.module.css";

type DraftExercise = {
  exerciseId: string;
  exerciseName: string;
  training?: TrainingConfig;
  sets: {
    weight: number | null;
    reps: number | null;
  }[];
};

type WorkoutDraft = {
  _id: string;
  status: "building" | "active" | "completed" | "abandoned";
  purpose: "workout" | "template";
  selectedMuscleGroups: string[];
  exercises: DraftExercise[];
};

type SortableSummaryExerciseCardProps = {
  exercise: DraftExercise;
  index: number;
  total: number;
  isReordering: boolean;
  onMove: (from: number, to: number) => void;
  onSave: (config: TrainingConfig) => Promise<void>;
  onDirty: (dirty: boolean) => void;
};

const categoryOptions: WorkoutTemplateCategory[] = [
  "full_body",
  "push",
  "pull",
  "legs",
  "upper",
  "lower",
  "custom",
];

function formatCategory(category: string) {
  return category
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function SortableSummaryExerciseCard({
  exercise,
  index,
  total,
  isReordering,
  onMove,
  onSave, onDirty,
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
      style={style}
    >
      <Card className={styles.exerciseCard}>
        <div className={styles.exerciseHeader}>
          <div>
            <p className={styles.exerciseNumber}>
              Exercise {index + 1}
            </p>

            <h3 className={styles.exerciseTitle}>
              {exercise.exerciseName}
            </h3>
          </div>

          <div className={styles.reorderControls}>
          <Button type="button" variant="ghost" iconOnly aria-label={`Move ${exercise.exerciseName} up`} disabled={index === 0 || isReordering} onClick={() => onMove(index, index - 1)}><Icon icon={ArrowUp} /></Button>
          <Button type="button" variant="ghost" iconOnly aria-label={`Move ${exercise.exerciseName} down`} disabled={index === total - 1 || isReordering} onClick={() => onMove(index, index + 1)}><Icon icon={ArrowDown} /></Button>
          <button type="button" className={styles.dragHandle} {...attributes} {...listeners} disabled={isReordering}
            aria-label={`Reorder ${exercise.exerciseName}`}><Icon icon={GripVertical} /></button>
          </div>
        </div>
      <TrainingConfigForm initial={exercise.training} onSave={onSave} onDirty={onDirty} />
      </Card>
    </div>
  );
}

export default function WorkoutSummaryPage() {
  const { draftId } = useParams();
  const { user } = useAuth();
  const query = useQuery(draftDetailOptions(user?._id ?? "", draftId ?? ""));
  const navigate = useNavigate();
  if (query.isPending && draftId) return <LoadingState layout="summary" className={styles.page} title="Workout builder" message="Loading workout summary..." />;
  if (!query.data) return <Box className={styles.page}><Card className={styles.stateCard}><h1>Workout summary</h1><p role="alert">{query.error?.message ?? "Missing workout draft"}</p><Button onClick={() => navigate("/workout-select")}>Go back</Button></Card></Box>;
  return <WorkoutSummaryForm key={(user?._id ?? "") + ":" + draftId} draft={query.data} />;
}
function WorkoutSummaryForm({ draft }: { draft: WorkoutDraft }) {
  const draftId = draft._id;
  const navigate = useNavigate();
  const [dirtyConfigs, setDirtyConfigs] = useState<Record<string, boolean>>({});
  const hasUnsavedConfigs = Object.values(dirtyConfigs).some(Boolean);
  const startWorkout = useMutation({ mutationFn: startWorkoutDraftRequest });
  const isStartingWorkout = startWorkout.isPending;
  const [orderedExercises, setOrderedExercises] = useState<DraftExercise[]>(() => draft.exercises);
  const reorderExercises = useMutation({ mutationFn: (exerciseIds: string[]) =>
    reorderWorkoutDraftExercisesRequest(draftId!, exerciseIds) });
  const isReordering = reorderExercises.isPending;

  const [actionError, setActionError] = useState("");

  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [templateCategory, setTemplateCategory] =
    useState<WorkoutTemplateCategory>("custom");
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const saveTemplate = useMutation({
    mutationFn: (data: Parameters<typeof createWorkoutTemplateFromDraftRequest>[1]) =>
      createWorkoutTemplateFromDraftRequest(draftId!, data),
    onSuccess: () => {
      if (user?._id && queryClient.getQueryData<{ _id: string }>(authKey)?._id === user._id) {
        void queryClient.invalidateQueries({ queryKey: templateKeys.mine(user._id) });
        void queryClient.invalidateQueries({ queryKey: templateKeys.public });
      }
    },
  });
  const isSavingTemplate = saveTemplate.isPending;

  const trainingMutation = useMutation({ mutationFn: (data: Parameters<typeof updateWorkoutDraftTrainingRequest>[1]) => updateWorkoutDraftTrainingRequest(draftId, data) });
  const selectedExercises = orderedExercises;
  const totalExercises = selectedExercises.length;
  const isTemplateDraft = draft?.purpose === "template";

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 30,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  async function saveExerciseOrder(
    nextOrder: DraftExercise[],
    previousOrder: DraftExercise[],
  ) {
    if (!draftId) {
      return;
    }

    setActionError("");

    try {
      await reorderExercises.mutateAsync(
        nextOrder.map((exercise) => exercise.exerciseId),
      );
    } catch (err) {
      setOrderedExercises(previousOrder);
      setActionError(
        err instanceof Error ? err.message : "Failed to reorder exercises",
      );
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

    moveExercise(oldIndex, newIndex);
  }

  function moveExercise(oldIndex: number, newIndex: number) {
    if (isReordering || newIndex < 0 || newIndex >= orderedExercises.length) return;
    const previousOrder = orderedExercises;
    const nextOrder = arrayMove(orderedExercises, oldIndex, newIndex);

    setOrderedExercises(nextOrder);
    void saveExerciseOrder(nextOrder, previousOrder);
  }

  async function handleStartWorkout() {
    if (!draftId) {
      navigate("/workout-select");
      return;
    }

    try {
      setActionError("");

      await startWorkout.mutateAsync(draftId);

      navigate(`/workout/${draftId}`);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to start workout",
      );
    }
  }

  function handleOpenTemplateModal() {
    setActionError("");

    if (!draft) {
      return;
    }

    setTemplateName("");
    setTemplateDescription("");
    setTemplateCategory("custom");
    setIsTemplateModalOpen(true);
  }

  function handleCloseTemplateModal() {
    if (isSavingTemplate) {
      return;
    }

    setIsTemplateModalOpen(false);
  }

  async function handleSaveTemplate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSavingTemplate) return;

    if (!draftId) {
      return;
    }

    if (!templateName.trim()) {
      setActionError("Template name is required.");
      return;
    }

    try {
      setActionError("");

      await saveTemplate.mutateAsync({
        name: templateName.trim(),
        description: templateDescription.trim() || undefined,
        category: templateCategory,
      });

      setIsTemplateModalOpen(false);
      navigate("/templates/my");
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to save template",
      );
    }
  }

  return (
    <Box className={styles.page}>
      <div className={styles.header}>
        <div>
          <p className={styles.kicker}>
            {isTemplateDraft ? "Workout builder" : "Workout builder"}
          </p>

          <h1 className={styles.title}>
            {isTemplateDraft ? "Workout summary" : "Workout summary"}
          </h1>

          <p className={styles.subtitle}>
            {isTemplateDraft
              ? "Review the exercise order, then save your template."
              : "Review the exercise order, then start training."}
          </p>

          <Button
            type="button"
            variant="secondary"
            style={{ minWidth: "3.25rem", marginTop: "1rem" }}
            iconOnly
                        className={styles.backButton}
                    aria-label="Go back"
            onClick={() => navigate(-1)}
          >
            <Icon icon={ArrowLeft} />
          </Button>
        </div>

      </div>

      {actionError && (
        <Card className={styles.errorCard}>
          <p>{actionError}</p>
        </Card>
      )}

      <Card className={styles.summaryCard}>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Exercises</span>
            <span className={styles.summaryValue}>{totalExercises}</span>
          </div>

          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Type</span>
            <span className={styles.summaryValue}>
              {isTemplateDraft ? "Template" : "Workout"}
            </span>
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
            <h2 className={styles.sectionTitle}>
              Selected exercises
            </h2>

            <p className={styles.sectionText}>
              {isTemplateDraft
                ? "These exercises will be saved into your reusable template."
                : "These exercises will be included in your workout session."}
              <br />
              Use the drag handle to reorder. Keyboard: Space, arrow keys, then Space.
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
              items={selectedExercises.map(
                (exercise) => exercise.exerciseId,
              )}
              strategy={verticalListSortingStrategy}
            >
              <div className={styles.exerciseList}>
                {selectedExercises.map((exercise, index) => (
                  <SortableSummaryExerciseCard
                    key={exercise.exerciseId}
                    exercise={exercise}
                    index={index}
                    total={selectedExercises.length}
                    isReordering={isReordering}
                    onMove={moveExercise}
                    onDirty={dirty => setDirtyConfigs(prev => ({ ...prev, [exercise.exerciseId]: dirty }))}
                    onSave={async training => {
                      await trainingMutation.mutateAsync({ exerciseId: exercise.exerciseId, training });
                      setOrderedExercises(prev => prev.map(e => e.exerciseId === exercise.exerciseId ? { ...e, training } : e));
                    }}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <Card className={styles.stateCard}>
            <p className={styles.stateText}>
              No exercises selected yet. Go back and choose at least
              one exercise.
            </p>
          </Card>
        )}
      </section>

      {hasUnsavedConfigs && <p role="status">Save each changed training configuration before continuing.</p>}
      <div className={styles.footer}>
        <p className={styles.footerText}>
          {selectedExercises.length === 0
            ? "Choose exercises before continuing."
            : `${selectedExercises.length} exercise${selectedExercises.length === 1 ? "" : "s"
            } ready.`}
        </p>

        <div className={styles.actions}>

          {isTemplateDraft ? (
            <Button
              type="button"
              variant="primary"
              onClick={handleOpenTemplateModal}
              disabled={
                hasUnsavedConfigs || isReordering || selectedExercises.length === 0 || isSavingTemplate
              }
            >
              {isSavingTemplate ? (
                <LoadingPredator
                  size="small"
                  color="currentColor"
                  label="Saving..."
                  showLabel
                />
              ) : (
                "Save template"
              )}
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              onClick={handleStartWorkout}
              disabled={
                hasUnsavedConfigs || isReordering || selectedExercises.length === 0 ||
                isStartingWorkout
              }
            >
              {isStartingWorkout ? (
                <LoadingPredator
                  size="small"
                  color="currentColor"
                  label="Starting..."
                  showLabel
                />
              ) : (
                "Start workout"
              )}
            </Button>
          )}
        </div>
      </div>

      <Modal
        title="Save as template"
        isOpen={isTemplateModalOpen}
        onClose={handleCloseTemplateModal}
        actions={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseTemplateModal}
              disabled={isSavingTemplate}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              form="save-template-form"
              disabled={isSavingTemplate}
            >
              {isSavingTemplate ? (
                <LoadingPredator
                  size="small"
                  color="currentColor"
                  label="Saving..."
                  showLabel
                />
              ) : (
                "Save template"
              )}
            </Button>
          </>
        }
      >
        {actionError && <p className={styles.errorCard} role="alert">{actionError}</p>}
        <form
          id="save-template-form"
          className={styles.templateForm}
          onSubmit={handleSaveTemplate}
        >
          <label className={styles.templateField}>
            <span>Name *</span>
            <input
              type="text"
              value={templateName}
              placeholder="Example: My Push Day"
              onChange={(event) =>
                setTemplateName(event.target.value)
              }
            />
          </label>

          <label className={styles.templateField}>
            <span>Category</span>
            <select
              value={templateCategory}
              onChange={(event) =>
                setTemplateCategory(
                  event.target.value as WorkoutTemplateCategory,
                )
              }
            >
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {formatCategory(category)}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.templateField}>
            <span>Description</span>
            <textarea
              value={templateDescription}
              placeholder="Short description for this template"
              onChange={(event) =>
                setTemplateDescription(event.target.value)
              }
            />
          </label>
        </form>
      </Modal>
    </Box>
  );
}
