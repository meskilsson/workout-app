import { sessionExpiredEvent, setSessionActive } from "../utils/apiFetch";
import { clearUserSnapshots } from "../utils/workoutProgressStorage";
import { createContext, useContext, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authKey, clearAccountCache } from "../query/queryClient";
import {
    getMeRequest,
    logoutRequest,
} from "../services/authApi";

import type { User } from "../services/authApi";


type AuthContextType = {
    user: User | null;
    isAuthenticated: boolean;
    loading: boolean;
    sessionExpired: boolean;
    login: (userData: User) => void;
    logout: () => Promise<void>;
    updateAuthUser: (userData: User) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const queryClient = useQueryClient();
    const [sessionExpired, setSessionExpired] = useState(false);
    useEffect(() => {
        const expire = () => {
            setSessionExpired(true);
            clearAccountCache(queryClient);
            queryClient.setQueryData(authKey, null);
        };
        window.addEventListener(sessionExpiredEvent, expire);
        return () => window.removeEventListener(sessionExpiredEvent, expire);
    }, [queryClient]);
    const auth = useQuery({
        queryKey: authKey,
        queryFn: ({ signal }) => getMeRequest(signal),
        staleTime: 60000,
        refetchOnWindowFocus: true,
    });
    const user = auth.data ?? null;
    const loading = auth.isPending;
    const logoutMutation = useMutation({ mutationFn: logoutRequest });

    function login(userData: User) {
        setSessionActive(true);
        setSessionExpired(false);
        // Cancel old-account reads before publishing the new identity.
        clearAccountCache(queryClient);
        queryClient.setQueryData(authKey, userData);
    }

    function updateAuthUser(userData: User) {
        queryClient.setQueryData(authKey, userData);
    }

    async function logout() {
        await logoutMutation.mutateAsync();
        setSessionActive(false);
        setSessionExpired(false);
        if (user) clearUserSnapshots(user._id);
        clearAccountCache(queryClient);
        queryClient.setQueryData(authKey, null);
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                loading,
                sessionExpired,
                login,
                logout,
                updateAuthUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used inside an AuthProvider");
    }

    return context;
}
