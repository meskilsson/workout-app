import { useTranslation } from "react-i18next";
import { t } from "../../i18n";
import { Dumbbell, Plus } from "lucide-react";
import Icon from "../ui/icon/Icon";
import { NavLink, Outlet } from "../../routes/navigation";

import Box from "../../components/ui/box/Box";
import { useAuth } from "../../context/AuthContext";

import styles from "./TemplatesLayout.module.css";

export default function TemplatesLayout() {
    useTranslation();
    const { isAuthenticated } = useAuth();

    return (
        <Box className={styles.page}>
            <div className={styles.layout}>
                <aside className={styles.sidebar}>
                    <nav className={styles.nav} aria-label={t("TemplatesLayout.templateNavigation")}>
                        <NavLink animated
                            to="/templates/pre-made"
                            className={({ isActive }) =>
                                `${styles.navLink} ${isActive ? styles.activeLink : ""
                                }`
                            }
                        >
                            <Icon icon={Dumbbell} /> {t("TemplatesLayout.preMade")} </NavLink>

                        {isAuthenticated ? (
                            <>
                                <NavLink animated
                                    to="/templates/my"
                                    className={({ isActive }) =>
                                        `${styles.navLink} ${isActive ? styles.activeLink : ""
                                        }`
                                    }
                                >
                                    <Icon icon={Dumbbell} /> {t("common.myTemplates")} </NavLink>

                                <NavLink animated
                                    to="/templates/create"
                                    className={({ isActive }) =>
                                        `${styles.navLink} ${isActive ? styles.activeLink : ""
                                        }`
                                    }
                                >
                                    <Icon icon={Plus} /> {t("common.createTemplate")} </NavLink>
                            </>
                        ) : (
                            <>
                                <div className={styles.disabledLink}> {t("common.myTemplates")} <span>{t("common.logInRequired")}</span>
                                </div>

                                <div className={styles.disabledLink}> {t("common.createTemplate")} <span>{t("common.logInRequired")}</span>
                                </div>
                            </>
                        )}
                    </nav>
                </aside>

                <div className={styles.content}>
                    <Outlet />
                </div>
            </div>
        </Box>
    );
}
