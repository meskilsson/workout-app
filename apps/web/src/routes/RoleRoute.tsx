import { useTranslation } from "react-i18next";
import { t } from "../i18n";
import { Navigate } from "./navigation";

import { useAuth } from "../context/AuthContext";

import AppLoadingSkeleton from "../components/Loading/AppLoadingSkeleton";

type AllowedRole = "user" | "admin";

export default function RoleRoute({
    children,
    allowedRoles,
}: {
    children: React.ReactNode;
    allowedRoles: AllowedRole[];
}) {
    useTranslation();
    const {
        user,
        isAuthenticated,
        loading,
    } = useAuth();

    if (loading) {
        return (
            <AppLoadingSkeleton message={t("RoleRoute.checkingPermissions")} />
        );
    }

    if (!isAuthenticated || !user) {
        return <Navigate to="/login" replace />;
    }

    if (!allowedRoles.includes(user.role)) {
        return <Navigate to="/profile" replace />;
    }

    return <>{children}</>;
}
