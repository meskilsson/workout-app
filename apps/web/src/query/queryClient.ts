import { QueryClient } from "@tanstack/react-query";
import type { GetExercisesParams } from "@workout-app/shared";

export function createQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
                refetchOnWindowFocus: false,
                refetchOnReconnect: true,
                // Preserve the existing immediate error feedback when offline.
                networkMode: "always",
            },
            mutations: { retry: false, networkMode: "always" },
        },
    });
}

export const authKey = ["auth", "me"] as const;
export function clearAccountCache(client: QueryClient) {
    void client.cancelQueries();
    client.removeQueries({ predicate: query => query.queryKey[0] !== "auth" });
    client.getMutationCache().clear();
}

export const templateKeys = {
    public: ["templates", "public"] as const,
    detail: (source: "public" | "my", userId: string | undefined, id: string) =>
        source === "my"
            ? [...templateKeys.mine(userId ?? ""), "detail", id] as const
            : [...templateKeys.public, "detail", userId ?? "guest", id] as const,
    mine: (userId: string) => ["templates", "user", userId] as const,
};

export const exerciseKeys = {
    scope: (userId?: string) => ["exercises", userId ?? "public"] as const,
    list: (userId: string | undefined, params: GetExercisesParams) => [...exerciseKeys.scope(userId), "list", params] as const,
    detail: (userId: string | undefined, id: string) => [...exerciseKeys.scope(userId), "detail", id] as const,
};

export const sessionKeys = {
    scope: (userId: string) => ["sessions", userId] as const,
    list: (userId: string) => [...sessionKeys.scope(userId), "list"] as const,
    detail: (userId: string, id: string) => [...sessionKeys.scope(userId), "detail", id] as const,
};

export const draftKeys = {
    scope: (userId: string) => ["drafts", userId] as const,
    detail: (userId: string, id: string) => [...draftKeys.scope(userId), id] as const,
    restoration: (userId: string) => ["workout-restoration", userId] as const,
};
export const adminKeys = {
    scope: (userId: string) => ["admin", userId] as const,
    list: (userId: string, section: string, search: string, page: number, scope: string) =>
        [...adminKeys.scope(userId), "list", section, { search, page, scope }] as const,
    detail: (userId: string, resource: string, id: string) => [...adminKeys.scope(userId), "detail", resource, id] as const,
};

// Publish write responses before another page seeds its local editable state.
export async function cacheSavedDraft(client: QueryClient, userId: string, draftId: string, draft: unknown) {
    const queryKey = draftKeys.detail(userId, draftId);
    // A read started before the write must not replace the saved response later.
    await client.cancelQueries({ queryKey, exact: true });
    if (client.getQueryData<{ _id: string }>(authKey)?._id !== userId) return;
    client.setQueryData(queryKey, draft);
}
