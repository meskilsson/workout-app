import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingPredator from "../components/Loading/LoadingPredator";
import Card from "../components/ui/cards/Card";

export default function PublicRoute({
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

    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}