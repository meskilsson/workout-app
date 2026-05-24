import { useState } from "react";
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

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const currentWorkoutPath = currentWorkoutId
    ? `/workout/${currentWorkoutId}`
    : null;

  const shouldShowCurrentWorkout =
    isAuthenticated && currentWorkoutPath !== null;

  function closeMenu() {
    setIsMenuOpen(false);
  }

  function navLinkClass(isActive: boolean) {
    return `${styles.link} ${isActive ? styles.linkActive : ""}`.trim();
  }

  async function handleLogout() {
    await logout();
    closeMenu();
    navigate("/login");
  }

  function handleCurrentWorkout() {
    if (!currentWorkoutPath) return;

    closeMenu();
    navigate(currentWorkoutPath);
  }

  function handleNavigate(path: string) {
    closeMenu();
    navigate(path);
  }

  const navLinks = (
    <>
      <NavLink to="/" className={({ isActive }) => navLinkClass(isActive)} onClick={closeMenu}>
        Home
      </NavLink>

      <NavLink to="/templates" className={({ isActive }) => navLinkClass(isActive)} onClick={closeMenu}>
        Workouts
      </NavLink>

      <NavLink to="/library" className={({ isActive }) => navLinkClass(isActive)} onClick={closeMenu}>
        Library
      </NavLink>

      {isAuthenticated && (
        <>
          <NavLink
            to="/create-exercise"
            className={({ isActive }) => navLinkClass(isActive)}
            onClick={closeMenu}
          >
            Create Exercise
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) => navLinkClass(isActive)}
            onClick={closeMenu}
          >
            Profile
          </NavLink>
        </>
      )}
    </>
  );

  const authActions = (
    <>
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
          <Button variant="ghost" onClick={() => handleNavigate("/login")}>
            Login
          </Button>

          <Button onClick={() => handleNavigate("/signup")}>Sign up</Button>
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
    </>
  );

  return (
    <nav className={styles.navbar}>
      <div className={styles.inner}>
        <div className={styles.leftSide}>
          <button
            className={styles.brand}
            type="button"
            onClick={() => handleNavigate("/")}
          >
            <img
              src="/moose_charging_kettlebell_clean_transparent.png"
              alt="Moose logo"
              className={styles.logo}
            />
          </button>

          <div className={styles.links}>{navLinks}</div>
        </div>

        <div className={styles.actions}>{authActions}</div>

        <button
          type="button"
          className={styles.menuButton}
          onClick={() => setIsMenuOpen((current) => !current)}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
        >
          <span className={styles.menuLine} />
          <span className={styles.menuLine} />
          <span className={styles.menuLine} />
        </button>
      </div>

      <div
        className={`${styles.mobileMenu} ${isMenuOpen ? styles.mobileMenuOpen : ""
          }`.trim()}
      >
        <div className={styles.mobileLinks}>{navLinks}</div>

        <div className={styles.mobileActions}>{authActions}</div>
      </div>
    </nav>
  );
}