import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { exerciseDetailOptions } from "../query/resourceQueries";
import { snapshotExerciseName } from "../i18n/exercises";

// Snapshots retain canonical names. Resolve by ID so a custom exercise with the
// same name as a shared exercise is never translated accidentally.
export default function useExerciseName(id: string | null | undefined, fallback: string) {
    const { i18n } = useTranslation();
    const { user } = useAuth();
    const query = useQuery({ ...exerciseDetailOptions(user?._id, id ?? ""),
        enabled: !!id && i18n.resolvedLanguage === "sv", retry: false });
    return snapshotExerciseName(query.data, fallback);
}
