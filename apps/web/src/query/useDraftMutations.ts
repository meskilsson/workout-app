import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { authKey, draftKeys, sessionKeys, exerciseKeys, cacheSavedDraft } from "./queryClient";
import * as api from "../services/workoutDraftApi";
export function useDraftMutations(draftId: string) {
    const client = useQueryClient();
    const { user } = useAuth();
    const userId = user?._id ?? "";
    const invalidate = () => {
        if (client.getQueryData<{ _id: string }>(authKey)?._id !== userId) return;
        void client.invalidateQueries({ queryKey: draftKeys.detail(userId, draftId), refetchType: "none" });
    };
    const ended = () => {
        invalidate();
        if (client.getQueryData<{ _id: string }>(authKey)?._id !== userId) return;
        client.removeQueries({ queryKey: draftKeys.detail(userId, draftId) });
        void client.invalidateQueries({ queryKey: sessionKeys.scope(userId) });
        void client.invalidateQueries({ queryKey: exerciseKeys.scope(userId) });
    };
    const sets = useMutation({ mutationFn: (data: Parameters<typeof api.updateWorkoutDraftSetsRequest>[1]) => api.updateWorkoutDraftSetsRequest(draftId, data), onSuccess: invalidate });
    const training = useMutation({ mutationFn: (data: Parameters<typeof api.updateWorkoutDraftTrainingRequest>[1]) => api.updateWorkoutDraftTrainingRequest(draftId, data), onSuccess: invalidate });
    const reorder = useMutation({ mutationFn: (ids: string[]) => api.reorderWorkoutDraftExercisesRequest(draftId, ids), onSuccess: invalidate });
    const remove = useMutation({ mutationFn: (id: string) => api.removeWorkoutDraftExerciseRequest(draftId, id), onSuccess: invalidate });
    const select = useMutation({ mutationFn: (data: { exerciseIds: string[]; active: boolean }) => data.active ? api.addWorkoutDraftExercisesRequest(draftId, { exerciseIds: data.exerciseIds }) : api.updateWorkoutDraftExercisesRequest(draftId, { exerciseIds: data.exerciseIds }), onSuccess: draft => cacheSavedDraft(client, userId, draftId, draft) });
    const start = useMutation({ mutationFn: () => api.startWorkoutDraftRequest(draftId), onSuccess: invalidate });
    const abandon = useMutation({ mutationFn: () => api.abandonWorkoutDraftRequest(draftId), onSuccess: ended });
    // The caller supplies the existing final-save/status-recovery transaction as one mutation.
    const complete = useMutation({ mutationFn: (finish: () => Promise<string>) => finish(), onSuccess: ended });
    return { sets, training, reorder, remove, select, start, abandon, complete };
}
