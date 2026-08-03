import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Card from "../components/ui/cards/Card";
import LoadingPredator from "../components/Loading/LoadingPredator";

export default function ProtectedRoute({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <Card>
            <LoadingPredator />
            Loading...</Card>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}