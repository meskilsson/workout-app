import { NavLink, useNavigate } from "react-router-dom";
import Button from "../ui/button/Button";
import { useAuth } from "../../context/AuthContext";
import ThemeSelect from "../theme/ThemeSelect";
import styles from "./Navbar.module.css";

import { useCurrentWorkout } from "@workout-app/shared/currentWorkoutContext";
import { useWorkoutTimer } from "@workout-app/shared/timer";
import { formatElapsedDuration } from "@workout-app/shared/utils/formatElapsedTime";

export default function Navbar() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const { currentWorkoutId } = useCurrentWorkout();
  const { state: timerState } = useWorkoutTimer();

  const currentWorkoutPath = currentWorkoutId
    ? `/workout/${currentWorkoutId}`
    : null;

  const shouldShowCurrentWorkout =
    isAuthenticated && currentWorkoutPath !== null;

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  function handleCurrentWorkout() {
    if (!currentWorkoutPath) return;

    navigate(currentWorkoutPath);
  }

  return (
    <nav className={styles.navbar}>
      <div className={styles.inner}>
        <div className={styles.centerNav}>
          <button
            className={styles.brand}
            type="button"
            onClick={() => navigate("/")}
          >
            <img
              src="/moose_charging_kettlebell_clean_transparent.png"
              alt="Moose logo"
              className={styles.logo}
            />
          </button>

          <div className={styles.links}>
            <NavLink
              to="/"
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

            <NavLink
              to="/library"
              className={({ isActive }) =>
                `${styles.link} ${isActive ? styles.linkActive : ""}`.trim()
              }
            >
              Library
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

              <Button onClick={() => navigate("/signup")}>Sign up</Button>
            </>
          )}

          {shouldShowCurrentWorkout && (
            <div className={styles.currentWorkout}>
              <Button variant="ghost" onClick={handleCurrentWorkout}>
                Current Workout
              </Button>

              <span className={styles.timerText}>
                {formatElapsedDuration(timerState.elapsedTime)}
              </span>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
