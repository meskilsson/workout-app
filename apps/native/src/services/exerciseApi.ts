import { apiFetch } from "./apiClient";

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
};

export async function exercisePublicExercisesRequest() {
  return apiFetch<ExercisesResponse>("/api/exercises", {
    method: "GET",
  });
}