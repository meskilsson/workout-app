import { useTranslation } from "react-i18next";
import { t } from "../../i18n";
import { UserRound, History, Dumbbell, Settings } from "lucide-react";
import Icon from "../ui/icon/Icon";
import { NavLink, Outlet } from "../../routes/navigation";
import styles from "./AccountLayout.module.css";

export default function AccountLayout() {
    useTranslation();

    return (
        <section className={styles.page}>
            <div className={styles.accountLayout}>
                <aside className={styles.sideNav}>

                    <nav className={styles.links} aria-label={t("AccountLayout.profileNavigation")}>
                        <NavLink animated
                            to="/profile"
                            end
                            className={({ isActive }) =>
                                isActive
                                    ? `${styles.link} ${styles.activeLink}`
                                    : styles.link
                            }
                        >
                            <Icon icon={UserRound} /> {t("common.profile")} </NavLink>

                        <NavLink animated
                            to="/profile/workouts"
                            className={({ isActive }) =>
                                isActive
                                    ? `${styles.link} ${styles.activeLink}`
                                    : styles.link
                            }
                        >
                            <Icon icon={History} /> {t("common.workoutHistory")} </NavLink>

                        <NavLink animated
                            to="/profile/exercises"
                            className={({ isActive }) =>
                                isActive
                                    ? `${styles.link} ${styles.activeLink}`
                                    : styles.link
                            }
                        >
                            <Icon icon={Dumbbell} /> {t("common.myExercises")} </NavLink>

                        <NavLink animated
                            to="/profile/settings"
                            className={({ isActive }) =>
                                isActive
                                    ? `${styles.link} ${styles.activeLink}`
                                    : styles.link
                            }
                        >
                            <Icon icon={Settings} /> {t("AccountLayout.settings")} </NavLink>
                    </nav>
                </aside>

                <div className={styles.content}>
                    <Outlet />
                </div>
            </div>
        </section>
    );
}
