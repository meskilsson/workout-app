import { formatNumber, displayValue, translateMessage, t } from "../../i18n";
import { dragAccessibility } from "../../i18n/dragAccessibility";
import { useTranslation } from "react-i18next";
import { reportFormError, friendlyError } from "../../utils/formValidation";
import ValidatedForm from "../../components/forms/ValidatedForm";
import { cardRest, cardHover } from "../../components/motion/presets";
import { useReducedMotion } from "../../components/motion/useReducedMotion";
import { motion } from "motion/react";
import { sortableTransition } from "../../components/motion/sortableTransition";
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
  return displayValue(category
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" "));
}

function SortableSummaryExerciseCard({
  exercise,
  index,
  total,
  isReordering,
  onMove,
  onSave, onDirty,
}: SortableSummaryExerciseCardProps) {
    useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
        attributes: { roleDescription: t("drag.role") },
    id: exercise.exerciseId,
  });

  const reduced = useReducedMotion();
  const style = {
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 10 : "auto",
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={false}
      animate={{ transform: CSS.Transform.toString(transform) ?? "none" }}
      transition={sortableTransition(transition, reduced)}
    >
      <Card animate={cardRest} whileHover={cardHover} className={styles.exerciseCard}>
        <div className={styles.exerciseHeader}>
          <div>
            <p className={styles.exerciseNumber}> {t("common.exercise")} {index + 1}
            </p>

            <h3 className={styles.exerciseTitle}>
              {exercise.exerciseName}
            </h3>
          </div>

          <div className={styles.reorderControls}>
          <Button type="button" variant="ghost" iconOnly aria-label={t("WorkoutSummaryPage.moveValueUp", { value0: exercise.exerciseName })} disabled={index === 0 || isReordering} onClick={() => onMove(index, index - 1)}><Icon icon={ArrowUp} /></Button>
          <Button type="button" variant="ghost" iconOnly aria-label={t("WorkoutSummaryPage.moveValueDown", { value0: exercise.exerciseName })} disabled={index === total - 1 || isReordering} onClick={() => onMove(index, index + 1)}><Icon icon={ArrowDown} /></Button>
          <button type="button" className={styles.dragHandle} {...attributes} {...listeners} disabled={isReordering}
            aria-label={t("common.reorderValue", { value0: exercise.exerciseName })}><Icon icon={GripVertical} /></button>
          </div>
        </div>
      {exercise.training && exercise.training.format !== "strength" && <details><summary>{t("WorkoutSummaryPage.durationAmpIntervals")}</summary><TrainingConfigForm cardioOnly initial={exercise.training} onSave={onSave} onDirty={onDirty} /></details>}
      </Card>
    </motion.div>
  );
}

export default function WorkoutSummaryPage() {
    useTranslation();
  const { draftId } = useParams();
  const { user } = useAuth();
  const query = useQuery(draftDetailOptions(user?._id ?? "", draftId ?? ""));
  const navigate = useNavigate();
  if (query.isPending && draftId) return <LoadingState layout="summary" className={styles.page} title={t("common.workoutBuilder")} message={t("WorkoutSummaryPage.loadingWorkoutSummary")} />;
  if (!query.data) return <Box className={styles.page}><Card className={styles.stateCard}><h1>{t("common.workoutSummary")}</h1><p role="alert">{(query.error ? friendlyError(query.error, t("common.unableToLoadYourWorkoutPleaseTryAgain")) : t("common.missingWorkoutDraft"))}</p><Button onClick={() => navigate("/workout-select")}>{t("common.goBack")}</Button></Card></Box>;
  return <WorkoutSummaryForm key={(user?._id ?? "") + ":" + draftId} draft={query.data} />;
}
function WorkoutSummaryForm({ draft }: { draft: WorkoutDraft }) {
    useTranslation();
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
        friendlyError(err, t("common.failedToReorderExercises")),
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
        friendlyError(err, t("WorkoutSummaryPage.failedToStartWorkout")),
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
    const submittedForm = event.currentTarget;
    if (isSavingTemplate) return;

    if (!draftId) {
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
      if (!reportFormError(submittedForm, err)) setActionError(friendlyError(err, t("WorkoutSummaryPage.unableToSaveTemplatePleaseTryAgain")));
    }
  }

  return (
    <Box className={styles.page}>
      <div className={styles.header}>
        <div>
          <p className={styles.kicker}>
            {isTemplateDraft ? t("WorkoutSummaryPage.templateBuilder") : t("common.workoutBuilder")}
          </p>

          <h1 className={styles.title}>
            {isTemplateDraft ? t("WorkoutSummaryPage.templateReview") : t("common.workoutSummary")}
          </h1>

          <p className={styles.subtitle}>
            {isTemplateDraft
              ? t("WorkoutSummaryPage.reviewTheExerciseOrderThenSaveYourTemplate")
              : t("WorkoutSummaryPage.reviewTheExerciseOrderThenStartTraining")}
          </p>

          <Button
            type="button"
            variant="secondary"
            style={{ minWidth: "3.25rem", marginTop: "1rem" }}
            iconOnly
                        className={styles.backButton}
                    aria-label={t("common.goBack")}
            onClick={() => navigate(-1)}
          >
            <Icon icon={ArrowLeft} />
          </Button>
        </div>

      </div>

      {actionError && (
        <Card className={styles.errorCard}>
          <p>{translateMessage(actionError)}</p>
        </Card>
      )}

      <Card className={styles.summaryCard}>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>{t("common.exercises")}</span>
            <span className={styles.summaryValue}>{formatNumber(totalExercises)}</span>
          </div>

          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>{t("common.type")}</span>
            <span className={styles.summaryValue}>
              {isTemplateDraft ? t("WorkoutSummaryPage.template") : t("common.workout")}
            </span>
          </div>

          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>{t("WorkoutSummaryPage.status")}</span>
            <span className={styles.summaryValue}>
              {totalExercises > 0 ? t("WorkoutSummaryPage.ready") : t("WorkoutSummaryPage.incomplete")}
            </span>
          </div>
        </div>
      </Card>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}> {t("WorkoutSummaryPage.selectedExercises")} </h2>

            <p className={styles.sectionText}>
              {isTemplateDraft
                ? t("WorkoutSummaryPage.theseExercisesWillBeSavedIntoYourReusableTemplate")
                : t("WorkoutSummaryPage.theseExercisesWillBeIncludedInYourWorkoutSession")}
              <br /> {t("WorkoutSummaryPage.useTheDragHandleToReorderKeyboardSpaceArrow")} </p>
          </div>
        </div>

        {selectedExercises.length > 0 ? (
          <DndContext accessibility={dragAccessibility(selectedExercises.map(exercise => ({ id: exercise.exerciseId, name: exercise.exerciseName })))}
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
            <p className={styles.stateText}> {t("WorkoutSummaryPage.noExercisesSelectedYetGoBackAndChooseAt")} </p>
          </Card>
        )}
      </section>

      {hasUnsavedConfigs && <p role="status">{t("WorkoutSummaryPage.saveEachChangedTrainingConfigurationBeforeContinuing")}</p>}
      <div className={styles.footer}>
        <p className={styles.footerText}>
          {selectedExercises.length === 0
            ? t("WorkoutSummaryPage.chooseExercisesBeforeContinuing")
            : t("common.exercisesReady", { count: selectedExercises.length })}
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
                  label={t("common.saving")}
                  showLabel
                />
              ) : (
                t("common.saveTemplate")
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
                  label={t("common.starting")}
                  showLabel
                />
              ) : (
                t("common.startWorkout")
              )}
            </Button>
          )}
        </div>
      </div>

      <Modal
        title={t("WorkoutSummaryPage.saveAsTemplate")}
        isOpen={isTemplateModalOpen}
        onClose={handleCloseTemplateModal}
        actions={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseTemplateModal}
              disabled={isSavingTemplate}
            > {t("common.cancel")} </Button>

            <Button
              type="submit"
              form="save-template-form"
              disabled={isSavingTemplate}
            >
              {isSavingTemplate ? (
                <LoadingPredator
                  size="small"
                  color="currentColor"
                  label={t("common.saving")}
                  showLabel
                />
              ) : (
                t("common.saveTemplate")
              )}
            </Button>
          </>
        }
      >
        {actionError && <p className={styles.errorCard} role="alert">{translateMessage(actionError)}</p>}
        <ValidatedForm
          id="save-template-form"
          className={styles.templateForm}
          onSubmit={handleSaveTemplate}
        >
          <label className={styles.templateField}>
            <span>{t("common.name2")}</span>
            <input
              type="text"
              name="name" required minLength={2} maxLength={80} value={templateName}
              placeholder={t("WorkoutSummaryPage.exampleMyPushDay")}
              onChange={(event) =>
                setTemplateName(event.target.value)
              }
            />
          </label>

          <label className={styles.templateField}>
            <span>{t("common.category")}</span>
            <select
              name="category" value={templateCategory}
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
            <span>{t("common.description")}</span>
            <textarea
              name="description" maxLength={500} value={templateDescription}
              placeholder={t("WorkoutSummaryPage.shortDescriptionForThisTemplate")}
              onChange={(event) =>
                setTemplateDescription(event.target.value)
              }
            />
          </label>
        </ValidatedForm>
      </Modal>
    </Box>
  );
}
