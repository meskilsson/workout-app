import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UpdateExerciseInput } from "@workout-app/shared";
import { useAuth } from "../context/AuthContext";
import { createExerciseRequest, deleteExerciseRequest, updateExerciseRequest } from "../services/exerciseApi";
import { authKey } from "./queryClient";

function useExerciseCache() {
    const client = useQueryClient();
    const { user } = useAuth();
    return {
        onMutate: () => client.cancelQueries({ queryKey: ["exercises"] }),
        onSuccess: () => {
            if (client.getQueryData<{ _id: string }>(authKey)?._id !== user?._id) return;
            return client.invalidateQueries({ queryKey: ["exercises"] });
        },
    };
}

export function useCreateExerciseMutation() {
    return useMutation({ mutationFn: createExerciseRequest, ...useExerciseCache() });
}

export function useUpdateExerciseMutation() {
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateExerciseInput }) => updateExerciseRequest(id, data),
        ...useExerciseCache(),
    });
}

export function useDeleteExerciseMutation() {
    return useMutation({ mutationFn: deleteExerciseRequest, ...useExerciseCache() });
}
