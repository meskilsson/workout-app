import type { TrainingConfig, CardioCompletion } from "@workout-app/shared";
import { parseJsonResponse } from "../utils/parseJsonResponse";
export type Resource = "users" | "exercises" | "templates" | "sessions";
export type AdminSet = { reps?: number | null; weight?: number | null; restSeconds?: number | null; notes?: string };
export type AdminExerciseRow = { training?: TrainingConfig; cardioCompletion?: CardioCompletion; exercise?: string; exerciseId?: string | null; exerciseName?: string; plannedSets?: AdminSet[]; sets?: AdminSet[] };
export type AdminItem = {
  _id: string; name?: string; username?: string; email?: string; role?: "user" | "admin"; deletedAt?: string | null;
  createdAt?: string; updatedAt?: string; createdBy?: string | null; userId?: string;
  description?: string; instructions?: string; equipment?: string; difficulty?: string; exerciseType?: string;
  primaryMuscles?: string[]; secondaryMuscles?: string[]; videoUrl?: string; imageUrl?: string; isCustom?: boolean;
  category?: string; isPublic?: boolean; exercises?: AdminExerciseRow[]; startedAt?: string; endedAt?: string;
  totals?: Record<string, number>;
};
export type AdminList = { items: AdminItem[]; total: number; page: number; limit: number };
export async function adminRequest<T>(path: string, method = "GET", body?: unknown, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/admin${path}`, {
    signal, method, credentials: "include", headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  return parseJsonResponse<T>(response, "Admin request failed");
}
