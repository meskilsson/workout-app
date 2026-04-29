import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import styles from "./AccountLayout.module.css";

export default function AccountLayout() {
    const { user } = useAuth();

    return (
        <section className={styles.page}>
            <div className={styles.pageHeader}>
                <p className={styles.kicker}>My account</p>

                <h1 className={styles.title}>Training profile</h1>

                <p className={styles.subtitle}>
                    {user?.name
                        ? `Welcome back, ${user.name}. Manage your workouts, exercises, and account.`
                        : "Manage your workouts, exercises, and account."}
                </p>
            </div>

            <div className={styles.accountLayout}>
                <aside className={styles.sideNav}>
                    <h3 className={styles.header}>Profile</h3>

                    <nav className={styles.links} aria-label="Profile navigation">
                        <NavLink
                            to="/profile"
                            end
                            className={({ isActive }) =>
                                isActive
                                    ? `${styles.link} ${styles.activeLink}`
                                    : styles.link
                            }
                        >
                            Profile
                        </NavLink>

                        <NavLink
                            to="/profile/workouts"
                            className={({ isActive }) =>
                                isActive
                                    ? `${styles.link} ${styles.activeLink}`
                                    : styles.link
                            }
                        >
                            Workout history
                        </NavLink>

                        <NavLink
                            to="/profile/exercises"
                            className={({ isActive }) =>
                                isActive
                                    ? `${styles.link} ${styles.activeLink}`
                                    : styles.link
                            }
                        >
                            My exercises
                        </NavLink>

                        <NavLink
                            to="/profile/settings"
                            className={({ isActive }) =>
                                isActive
                                    ? `${styles.link} ${styles.activeLink}`
                                    : styles.link
                            }
                        >
                            Settings
                        </NavLink>
                    </nav>
                </aside>

                <main className={styles.content}>
                    <Outlet />
                </main>
            </div>
        </section>
    );
}