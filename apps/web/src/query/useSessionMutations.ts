import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { WorkoutSession } from "@workout-app/shared";
import { useAuth } from "../context/AuthContext";
import { deleteWorkoutSessionRequest, repeatWorkoutSessionRequest } from "../services/workoutSessionApi";
import { authKey, sessionKeys } from "./queryClient";

export function useRepeatSessionMutation() {
    return useMutation({ mutationFn: repeatWorkoutSessionRequest });
}

export function useDeleteSessionMutation() {
    const client = useQueryClient();
    const { user } = useAuth();
    const userId = user?._id ?? "";
    return useMutation({
        mutationFn: deleteWorkoutSessionRequest,
        onMutate: () => client.cancelQueries({ queryKey: sessionKeys.scope(userId) }),
        onSuccess: (_, id) => {
            if (client.getQueryData<{ _id: string }>(authKey)?._id !== userId) return;
            client.removeQueries({ queryKey: sessionKeys.detail(userId, id), exact: true });
            client.setQueryData<WorkoutSession[]>(sessionKeys.list(userId), previous => previous?.filter(session => session._id !== id));
            void client.invalidateQueries({ queryKey: ["exercises"] });
            return client.invalidateQueries({ queryKey: sessionKeys.list(userId) });
        },
    });
}
