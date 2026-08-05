import { Navigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import LoadingState from "../components/Loading/LoadingState";

type AllowedRole = "user" | "admin";

export default function RoleRoute({
    children,
    allowedRoles,
}: {
    children: React.ReactNode;
    allowedRoles: AllowedRole[];
}) {
    const {
        user,
        isAuthenticated,
        loading,
    } = useAuth();

    if (loading) {
        return (
            <LoadingState
                title="Workout App"
                message="Checking permissions..."
            />
        );
    }

    if (!isAuthenticated || !user) {
        return <Navigate to="/login" replace />;
    }

    if (!allowedRoles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}