import { useTranslation } from "react-i18next";
import { t } from "../i18n";
import { Navigate } from "./navigation";

import { useAuth } from "../context/AuthContext";

import AppLoadingSkeleton from "../components/Loading/AppLoadingSkeleton";

export default function PublicRoute({
    children,
}: {
    children: React.ReactNode;
}) {
    useTranslation();
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <AppLoadingSkeleton message={t("common.checkingYourSession")} />
        );
    }

    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}