import { Navigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import AppLoadingSkeleton from "../components/Loading/AppLoadingSkeleton";

export default function PublicRoute({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <AppLoadingSkeleton message="Checking your session..." />
        );
    }

    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}