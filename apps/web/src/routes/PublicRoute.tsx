import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PublicRoute({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <p>Loading...</p>
    }

    if (isAuthenticated) {
        return <Navigate to="/homepage" replace />
    }

    return <>{children}</>
}