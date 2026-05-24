import { NavLink, Outlet } from "react-router-dom";

import Box from "../../components/ui/box/Box";
import { useAuth } from "../../context/AuthContext";

import styles from "./TemplatesLayout.module.css";

export default function TemplatesLayout() {
    const { isAuthenticated } = useAuth();

    return (
        <Box className={styles.page}>
            <div className={styles.layout}>
                <aside className={styles.sidebar}>
                    <div className={styles.sidebarHeader}>
                        <p className={styles.kicker}>Workouts</p>
                        <h1 className={styles.title}>Workouts</h1>
                        <p className={styles.subtitle}>
                            Choose a pre-made workout or manage your own workouts.
                        </p>
                    </div>

                    <nav className={styles.nav}>
                        <NavLink
                            to="/templates/pre-made"
                            className={({ isActive }) =>
                                `${styles.navLink} ${isActive ? styles.activeLink : ""
                                }`
                            }
                        >
                            Pre-made
                        </NavLink>

                        {isAuthenticated ? (
                            <>
                                <NavLink
                                    to="/templates/my"
                                    className={({ isActive }) =>
                                        `${styles.navLink} ${isActive ? styles.activeLink : ""
                                        }`
                                    }
                                >
                                    My workouts
                                </NavLink>

                                <NavLink
                                    to="/templates/create"
                                    className={({ isActive }) =>
                                        `${styles.navLink} ${isActive ? styles.activeLink : ""
                                        }`
                                    }
                                >
                                    Create workout
                                </NavLink>
                            </>
                        ) : (
                            <>
                                <div className={styles.disabledLink}>
                                    My workouts
                                    <span>Log in required</span>
                                </div>

                                <div className={styles.disabledLink}>
                                    Create workouts
                                    <span>Log in required</span>
                                </div>
                            </>
                        )}
                    </nav>
                </aside>

                <main className={styles.content}>
                    <Outlet />
                </main>
            </div>
        </Box>
    );
}