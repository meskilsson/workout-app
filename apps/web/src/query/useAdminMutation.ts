import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { adminKeys, authKey } from "./queryClient";
export function useAdminMutation<T>(write: (data: T) => Promise<unknown>) {
    const { user } = useAuth();
    const client = useQueryClient();
    return useMutation({ mutationFn: write, onSuccess: () => {
        if (!user || client.getQueryData<{ _id: string }>(authKey)?._id !== user._id) return;
        void client.invalidateQueries({ queryKey: adminKeys.scope(user._id) });
        void client.invalidateQueries({ predicate: query => ["exercises", "templates", "sessions"].includes(String(query.queryKey[0])) });
    } });
}
