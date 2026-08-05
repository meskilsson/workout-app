import { Navigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import LoadingState from "../components/Loading/LoadingState";

export default function ProtectedRoute({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <LoadingState
                title="Workout App"
                message="Checking your session..."
            />
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}