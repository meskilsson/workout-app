import { NavLink, useNavigate } from "react-router-dom";
import Button from "../ui/button/Button";
import { useAuth } from "../../context/AuthContext";
import ThemeSelect from "../theme/ThemeSelect";
import styles from "./Navbar.module.css";

export default function Navbar() {
    const navigate = useNavigate();
    const { user, isAuthenticated, logout } = useAuth();

    async function handleLogout() {
        await logout();
        navigate("/login");
    }

    return (
        <nav className={styles.navbar}>
            <div className={styles.inner}>
                <button
                    className={styles.brand}
                    type="button"
                    onClick={() => navigate(isAuthenticated ? "/dashboard" : "/")}
                >
                    Workout App
                </button>

                <div className={styles.links}>
                    <NavLink
                        to={isAuthenticated ? "/dashboard" : "/"}
                        className={({ isActive }) =>
                            `${styles.link} ${isActive ? styles.linkActive : ""}`.trim()
                        }
                    >
                        Home
                    </NavLink>

                    <NavLink
                        to="/templates"
                        className={({ isActive }) =>
                            `${styles.link} ${isActive ? styles.linkActive : ""}`.trim()
                        }
                    >
                        Templates
                    </NavLink>

                    {isAuthenticated && (
                        <>
                            <NavLink
                                to="/create-exercise"
                                className={({ isActive }) =>
                                    `${styles.link} ${isActive ? styles.linkActive : ""}`.trim()
                                }
                            >
                                Create Exercise
                            </NavLink>

                            <NavLink
                                to="/profile"
                                className={({ isActive }) =>
                                    `${styles.link} ${isActive ? styles.linkActive : ""}`.trim()
                                }
                            >
                                Profile
                            </NavLink>
                        </>
                    )}
                </div>

                <div className={styles.actions}>
                    <ThemeSelect />

                    {isAuthenticated ? (
                        <>
                            <span className={styles.userText}>
                                {user?.username ? `@${user.username}` : "Logged in"}
                            </span>

                            <Button variant="ghost" onClick={handleLogout}>
                                Logout
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="ghost" onClick={() => navigate("/login")}>
                                Login
                            </Button>

                            <Button onClick={() => navigate("/signup")}>
                                Sign up
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}