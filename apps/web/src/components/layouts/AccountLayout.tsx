import { UserRound, History, Dumbbell, Settings } from "lucide-react";
import Icon from "../ui/icon/Icon";
import { NavLink, Outlet } from "../../routes/navigation";
import styles from "./AccountLayout.module.css";

export default function AccountLayout() {

    return (
        <section className={styles.page}>
            <div className={styles.accountLayout}>
                <aside className={styles.sideNav}>

                    <nav className={styles.links} aria-label="Profile navigation">
                        <NavLink animated
                            to="/profile"
                            end
                            className={({ isActive }) =>
                                isActive
                                    ? `${styles.link} ${styles.activeLink}`
                                    : styles.link
                            }
                        >
                            <Icon icon={UserRound} /> Profile
                        </NavLink>

                        <NavLink animated
                            to="/profile/workouts"
                            className={({ isActive }) =>
                                isActive
                                    ? `${styles.link} ${styles.activeLink}`
                                    : styles.link
                            }
                        >
                            <Icon icon={History} /> Workout history
                        </NavLink>

                        <NavLink animated
                            to="/profile/exercises"
                            className={({ isActive }) =>
                                isActive
                                    ? `${styles.link} ${styles.activeLink}`
                                    : styles.link
                            }
                        >
                            <Icon icon={Dumbbell} /> My exercises
                        </NavLink>

                        <NavLink animated
                            to="/profile/settings"
                            className={({ isActive }) =>
                                isActive
                                    ? `${styles.link} ${styles.activeLink}`
                                    : styles.link
                            }
                        >
                            <Icon icon={Settings} /> Settings
                        </NavLink>
                    </nav>
                </aside>

                <div className={styles.content}>
                    <Outlet />
                </div>
            </div>
        </section>
    );
}
