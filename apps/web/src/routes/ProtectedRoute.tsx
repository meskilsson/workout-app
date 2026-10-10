import { Navigate } from "./navigation";

import { useAuth } from "../context/AuthContext";

import AppLoadingSkeleton from "../components/Loading/AppLoadingSkeleton";

export default function ProtectedRoute({
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

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}