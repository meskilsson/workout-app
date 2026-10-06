import { Home, Dumbbell, BookOpen, Plus, UserRound, LogOut, Timer, Menu, X, History } from "lucide-react";
import Icon from "../ui/icon/Icon";
import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import Button from "../ui/button/Button";
import { useAuth } from "../../context/AuthContext";
import ThemeSelect from "../theme/ThemeSelect";
import styles from "./Navbar.module.css";

import { useCurrentWorkout } from "@workout-app/shared/currentWorkoutContext";
import { useWorkoutTimer } from "@workout-app/shared/timer";
import { formatElapsedDuration } from "@workout-app/shared/utils/formatElapsedTime";

export default function Navbar() {
  const navigate = useNavigate();
  const { pathname, key: locationKey } = useLocation();
  const isWorkoutPage = /^\/workout\/[^/]+$/.test(pathname);
  const { user, isAuthenticated, logout } = useAuth();

  const { currentWorkoutId } = useCurrentWorkout();
  const { state: timerState } = useWorkoutTimer();

  const [menuLocation, setMenuLocation] = useState<string | null>(null);
  const isMenuOpen = menuLocation === locationKey;
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  useEffect(() => {
    if (!isMenuOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuLocation(null);
        menuButtonRef.current?.focus();
      }
    }
    function onPointer(event: PointerEvent) {
      if (!navRef.current?.contains(event.target as Node)) setMenuLocation(null);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [isMenuOpen]);

  const currentWorkoutPath = currentWorkoutId
    ? `/workout/${currentWorkoutId}`
    : null;

  const shouldShowCurrentWorkout =
    isAuthenticated && currentWorkoutPath !== null;

  function closeMenu() {
    setMenuLocation(null);
  }

  function navLinkClass(isActive: boolean) {
    return `${styles.link} ${isActive ? styles.linkActive : ""}`.trim();
  }

  async function handleLogout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setLogoutError("");
    try {
      await logout();
      closeMenu();
      navigate("/login");
    } catch (error) {
      setLogoutError(error instanceof Error ? error.message : "Could not log out. Please try again.");
    } finally { setIsLoggingOut(false); }
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
        <Icon icon={Home} /> Home
      </NavLink>

      <NavLink to="/templates" className={({ isActive }) => navLinkClass(isActive)} onClick={closeMenu}>
        <Icon icon={Dumbbell} /> Workouts
      </NavLink>

      <NavLink to="/library" className={({ isActive }) => navLinkClass(isActive)} onClick={closeMenu}>
        <Icon icon={BookOpen} /> Library
      </NavLink>
      {user?.role === "admin" && <NavLink to="/admin" className={({ isActive }) => navLinkClass(isActive)} onClick={closeMenu}><Icon icon={UserRound} /> Admin</NavLink>}

      {isAuthenticated && (
        <>
          <NavLink to="/profile/workouts" className={({ isActive }) => navLinkClass(isActive)} onClick={closeMenu}>
            <Icon icon={History} /> History
          </NavLink>

          <NavLink
            to="/profile"
            end
            className={({ isActive }) => navLinkClass(isActive)}
            onClick={closeMenu}
          >
            <Icon icon={UserRound} /> Profile
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

          <Button variant="ghost" iconOnly aria-label="Log out" disabled={isLoggingOut} onClick={handleLogout}>
            <Icon icon={LogOut} />
          </Button>
        </>
      ) : (
        <>
          <Button variant="ghost" onClick={() => handleNavigate("/login")}>
            Log in
          </Button>

          <Button onClick={() => handleNavigate("/signup")}>Sign up</Button>
        </>
      )}

      {shouldShowCurrentWorkout && (
        <div className={styles.currentWorkout}>
          <Button variant="ghost" onClick={handleCurrentWorkout}>
            <Icon icon={Dumbbell} /> Resume workout
          </Button>

          <span className={styles.timerText}>
            <Icon icon={Timer} /> {formatElapsedDuration(timerState.elapsedTime)}
          </span>
        </div>
      )}
    </>
  );

  return (
    <>
    <nav ref={navRef} className={styles.navbar} aria-label="Header navigation">
      <div className={styles.inner}>
        <div className={styles.leftSide}>
          <button
            className={styles.brand}
            aria-label="Workout home"
            type="button"
            onClick={() => handleNavigate("/")}
          >
            <img
              src="/moose_charging_kettlebell_clean_transparent.png"
              alt="Moose logo"
              className={styles.logo}
            />
            <span>Workout</span>
          </button>

          <div className={styles.links}>{navLinks}</div>
        </div>

        <div className={styles.actions}>{authActions}</div>

        <button
          type="button"
          className={styles.menuButton}
          ref={menuButtonRef}
          onClick={() => setMenuLocation(isMenuOpen ? null : locationKey)}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-menu"
        >
          <Icon icon={isMenuOpen ? X : Menu} />
        </button>
      </div>

      {logoutError && <p className={styles.logoutError} role="alert">{logoutError}</p>}
      <div
        id="mobile-menu"
        className={`${styles.mobileMenu} ${isMenuOpen ? styles.mobileMenuOpen : ""
          }`.trim()}
      >
        <div className={styles.mobileLinks}>{navLinks}
          {isAuthenticated && <NavLink to="/create-exercise" className={({ isActive }) => navLinkClass(isActive)} onClick={closeMenu}><Icon icon={Plus} /> Create exercise</NavLink>}
        </div>

        <div className={styles.mobileActions}>{authActions}</div>
      </div>
    </nav>
    {!isWorkoutPage && !isMenuOpen && <nav className={styles.bottomNav} aria-label="Main navigation">
      <NavLink to="/" className={({ isActive }) => navLinkClass(isActive)} onClick={closeMenu}><Icon icon={Home} /><span>Home</span></NavLink>
      <NavLink to="/templates" className={({ isActive }) => navLinkClass(isActive || /^\/(workout-select|exercise-select|workout-summary|workout-result)(\/|$)/.test(pathname))} onClick={closeMenu}><Icon icon={Dumbbell} /><span>Workouts</span></NavLink>
      {isAuthenticated ? <NavLink to="/profile/workouts" className={({ isActive }) => navLinkClass(isActive)} onClick={closeMenu}><Icon icon={History} /><span>History</span></NavLink> : <NavLink to="/library" className={({ isActive }) => navLinkClass(isActive)} onClick={closeMenu}><Icon icon={BookOpen} /><span>Library</span></NavLink>}
      <NavLink to={isAuthenticated ? "/profile" : "/login"} className={({ isActive }) => navLinkClass(isActive || (isAuthenticated && pathname.startsWith("/profile/") && !pathname.startsWith("/profile/workouts")))} onClick={closeMenu} end><Icon icon={UserRound} /><span>{isAuthenticated ? "Profile" : "Log in"}</span></NavLink>
    </nav>}
    </>
  );
}
