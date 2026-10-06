import { useContext, createContext, useState, useEffect, ReactNode } from "react";

import { getMeRequest, loginRequest, type User } from "../services/authApi";

import { deleteAuthToken, getAuthToken, saveAuthToken } from "../storage/authStorage";

type AuthContextValue = {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
    children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const isAuthenticated = !!user && !!token;

    useEffect(() => {
        async function loadStoredAuth() {
            try {
                const storedToken = await getAuthToken();

                if (!storedToken) {
                    return;
                }

                const result = await getMeRequest(storedToken);

                setToken(storedToken);
                setUser(result.user);
            } catch (error) {
                console.log("Failed to load stored auth:", error);

                await deleteAuthToken();
                setToken(null);
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        }

        loadStoredAuth();
    }, []);


    async function login(email: string, password: string) {
        const result = await loginRequest(email, password);

        await saveAuthToken(result.token);

        setToken(result.token);
        setUser(result.user);
    }

    async function logout() {
        await deleteAuthToken();

        setToken(null);
        setUser(null);
    }

    async function refreshUser() {
        if (!token) {
            return;
        }

        const result = await getMeRequest(token);

        setUser(result.user);
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isLoading,
                isAuthenticated,
                login,
                logout,
                refreshUser,
            }}
        >{children}</AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used inside AuthProvider");
    }

    return context;
}