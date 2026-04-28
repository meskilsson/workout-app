import { createContext, useContext, useEffect, useState } from "react";
import { getMeRequest, logoutRequest } from "../services/authApi";

type User = {
    _id: string;
    name: string;
    email: string;
    username: string;
    profileImage: string | null;
    role: "user" | "admin";
};

type AuthContextType = {
    user: User | null;
    isAuthenticated: boolean;
    loading: boolean;
    login: (userData: User) => void;
    logout: () => Promise<void>;
    updateAuthUser: (userData: User) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadUser() {
            try {
                const currentUser = await getMeRequest();
                setUser(currentUser);
            } catch {
                setUser(null);
            } finally {
                setLoading(false);
            }
        }

        loadUser();
    }, []);

    function login(userData: User) {
        setUser(userData);
    }

    function updateAuthUser(userData: User) {
        setUser(userData);
    }

    async function logout() {
        await logoutRequest();
        setUser(null);
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                loading,
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