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
                        <p className={styles.kicker}>Workout templates</p>
                        <h1 className={styles.title}>Templates</h1>
                        <p className={styles.subtitle}>
                            Choose a pre-made workout or manage your own templates.
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
                                    My templates
                                </NavLink>

                                <NavLink
                                    to="/templates/create"
                                    className={({ isActive }) =>
                                        `${styles.navLink} ${isActive ? styles.activeLink : ""
                                        }`
                                    }
                                >
                                    Create template
                                </NavLink>
                            </>
                        ) : (
                            <>
                                <div className={styles.disabledLink}>
                                    My templates
                                    <span>Log in required</span>
                                </div>

                                <div className={styles.disabledLink}>
                                    Create templates
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