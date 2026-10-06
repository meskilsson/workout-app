import { apiFetch } from "./apiClient";

import type { Muscle } from "./workoutDraftApi";

export type Exercise = {
  _id: string;
  name: string;
  description?: string;
  instructions?: string;
  exerciseType?: "strength" | "cardio" | "mobility";
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  equipment?: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
  videoUrl?: string;
  imageUrl?: string;
  isCustom: boolean;
  createdBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type ExercisesResponse = {
  exercises: Exercise[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

type ExerciseLibraryParams = {
  muscles?: Muscle[];
  search?: string;
  page?: number;
  limit?: number;
};

function buildExerciseQuery(params: ExerciseLibraryParams) {
  const query = new URLSearchParams();

  query.set("page", String(params.page ?? 1));
  query.set("limit", String(params.limit ?? 50));

  if (params.search) {
    query.set("search", params.search);
  }

  if (params.muscles && params.muscles.length > 0) {
    query.set("muscles", params.muscles.join(","));
  }

  return query.toString();
}

export async function exercisePublicExercisesRequest() {
  return apiFetch<ExercisesResponse>("/api/exercises", {
    method: "GET",
  });
}

export async function exerciseLibraryRequest(
  token: string,
  params: ExerciseLibraryParams = {},
) {
  const query = buildExerciseQuery(params);

  return apiFetch<ExercisesResponse>(`/api/exercises/library?${query}`, {
    method: "GET",
    token,
  });
}