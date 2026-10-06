import { Dumbbell, Plus } from "lucide-react";
import Icon from "../ui/icon/Icon";
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
                    <nav className={styles.nav} aria-label="Template navigation">
                        <NavLink
                            to="/templates/pre-made"
                            className={({ isActive }) =>
                                `${styles.navLink} ${isActive ? styles.activeLink : ""
                                }`
                            }
                        >
                            <Icon icon={Dumbbell} /> Pre-made
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
                                    <Icon icon={Dumbbell} /> My templates
                                </NavLink>

                                <NavLink
                                    to="/templates/create"
                                    className={({ isActive }) =>
                                        `${styles.navLink} ${isActive ? styles.activeLink : ""
                                        }`
                                    }
                                >
                                    <Icon icon={Plus} /> Create template
                                </NavLink>
                            </>
                        ) : (
                            <>
                                <div className={styles.disabledLink}>
                                    My templates
                                    <span>Log in required</span>
                                </div>

                                <div className={styles.disabledLink}>
                                    Create template
                                    <span>Log in required</span>
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
