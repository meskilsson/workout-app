import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({
    children,
}: {
    children: React.ReactNode
}) {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <p>Loading...</p>
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    return <>{children}</>
}