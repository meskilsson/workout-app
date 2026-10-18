import type { TrainingConfig, CardioCompletion } from "@workout-app/shared";
import { apiFetch } from "./apiClient";

export type Muscle =
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "quads"
  | "hamstrings"
  | "glutes"
  | "calves"
  | "core"
  | "forearms";

export type WorkoutDraftSet = {
  id?: string;
  isWarmup?: boolean;
  weight: string | number | null;
  reps: string | number | null;
};

export type WorkoutDraftExercise = {
  supersetId?: string;
  exerciseId: string;
  exerciseName: string;
  training?: TrainingConfig;
  cardioCompletion?: CardioCompletion;
  sets: WorkoutDraftSet[];
};

export type WorkoutDraft = {
  includeCardio?: boolean;
  sourceTemplateId?: string | null;
  _id: string;
  userId: string;
  status: "building" | "active" | "completed" | "abandoned";
  purpose: "workout" | "template";
  selectedMuscleGroups: Muscle[];
  exercises: WorkoutDraftExercise[];
  startedAt?: string | null;
  completedSessionId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type WorkoutSessionSet = {
  weight: number;
  reps: number;
};

export type WorkoutSessionExercise = {
  exerciseId: string | null;
  exerciseName: string;
  training?: TrainingConfig;
  cardioCompletion?: CardioCompletion;
  sets: WorkoutSessionSet[];
};

export type WorkoutSession = {
  _id: string;
  userId: string;
  exercises: WorkoutSessionExercise[];
  startedAt: string;
  endedAt: string;
  createdAt: string;
  updatedAt: string;
};

export async function createWorkoutDraftRequest(
  token: string,
  selectedMuscleGroups: Muscle[],
) {
  return apiFetch<WorkoutDraft>("/api/workout-drafts", {
    method: "POST",
    token,
    body: JSON.stringify({
      selectedMuscleGroups,
      purpose: "workout",
    }),
  });
}

export async function getCurrentWorkoutDraftRequest(token: string) {
  return apiFetch<WorkoutDraft | null>("/api/workout-drafts/current", {
    method: "GET",
    token,
  });
}

export async function updateWorkoutDraftExercisesRequest(
  token: string,
  draftId: string,
  exerciseIds: string[],
) {
  return apiFetch<WorkoutDraft>(`/api/workout-drafts/${draftId}/exercises`, {
    method: "PATCH",
    token,
    body: JSON.stringify({
      exerciseIds,
    }),
  });
}

export async function startWorkoutDraftRequest(token: string, draftId: string) {
  return apiFetch<WorkoutDraft>(`/api/workout-drafts/${draftId}/start`, {
    method: "PATCH",
    token,
  });
}

export async function updateWorkoutDraftSetsRequest(
  token: string,
  draftId: string,
  exerciseId: string,
  sets: WorkoutDraftSet[],
) {
  return apiFetch<WorkoutDraft>(`/api/workout-drafts/${draftId}/sets`, {
    method: "PATCH",
    token,
    body: JSON.stringify({
      exerciseId,
      sets,
    }),
  });
}

export async function completeWorkoutDraftRequest(
  token: string,
  draftId: string,
) {
  return apiFetch<WorkoutSession>(`/api/workout-drafts/${draftId}/complete`, {
    method: "POST",
    token,
  });
}

export async function updateWorkoutDraftTrainingRequest(
  token: string,
  draftId: string,
  exerciseId: string,
  training: TrainingConfig,
  cardioCompletion?: CardioCompletion,
) {
  return apiFetch<WorkoutDraft>(`/api/workout-drafts/${draftId}/training`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ exerciseId, training, cardioCompletion }),
  });
}
