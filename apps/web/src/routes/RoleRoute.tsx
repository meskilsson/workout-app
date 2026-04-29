import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type AllowedRole = "user" | "admin";

export default function RoleRoute({
    children,
    allowedRoles,
}: {
    children: React.ReactNode;
    allowedRoles: AllowedRole[];
}) {
    const { user, isAuthenticated, loading } = useAuth();

    if (loading) {
        return <p>Loading...</p>;
    }

    if (!isAuthenticated || !user) {
        return <Navigate to="/login" replace />;
    }

    if (!allowedRoles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}