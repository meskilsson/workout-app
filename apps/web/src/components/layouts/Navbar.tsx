import { translateMessage, t } from "../../i18n";
import { useTranslation } from "react-i18next";
import { friendlyError } from "../../utils/formValidation";
import { Home, Dumbbell, BookOpen, Plus, UserRound, LogOut, Timer, Menu, X, History } from "lucide-react";
import Icon from "../ui/icon/Icon";
import { useEffect, useRef, useState } from "react";
import { NavLink } from "../../routes/navigation";
import { useNavigate, useLocation } from "../../routes/navigationHooks";
import Button from "../ui/button/Button";
import { useAuth } from "../../context/AuthContext";
import ThemeSelect from "../theme/ThemeSelect";
import styles from "./Navbar.module.css";
import LanguageSelect from "./LanguageSelect";

import { useCurrentWorkout } from "@workout-app/shared/currentWorkoutContext";
import { useWorkoutTimer } from "@workout-app/shared/timer";
import { formatElapsedDuration } from "@workout-app/shared/utils/formatElapsedTime";

export default function Navbar() {
    useTranslation();
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
      setLogoutError(friendlyError(error, t("Navbar.couldNotLogOutPleaseTryAgain")));
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
        <Icon icon={Home} /> {t("common.home")} </NavLink>

      <NavLink to="/templates" className={({ isActive }) => navLinkClass(isActive)} onClick={closeMenu}>
        <Icon icon={Dumbbell} /> {t("common.workouts")} </NavLink>

      <NavLink to="/library" className={({ isActive }) => navLinkClass(isActive)} onClick={closeMenu}>
        <Icon icon={BookOpen} /> {t("common.library")} </NavLink>
      {user?.role === "admin" && <NavLink to="/admin" className={({ isActive }) => navLinkClass(isActive)} onClick={closeMenu}><Icon icon={UserRound} /> {t("Navbar.admin")}</NavLink>}

      {isAuthenticated && (
        <>
          <NavLink to="/profile/workouts" className={({ isActive }) => navLinkClass(isActive)} onClick={closeMenu}>
            <Icon icon={History} /> {t("common.history")} </NavLink>

          <NavLink
            to="/profile"
            end
            className={({ isActive }) => navLinkClass(isActive)}
            onClick={closeMenu}
          >
            <Icon icon={UserRound} /> {t("common.profile")} </NavLink>
        </>
      )}
    </>
  );

  const authActions = (
    <>
      <ThemeSelect />
      <LanguageSelect />

      {isAuthenticated ? (
        <>
          <span className={styles.userText}>
            {user?.username ? `@${user.username}` : t("Navbar.loggedIn")}
          </span>

          <Button variant="ghost" iconOnly aria-label={t("common.logOut")} disabled={isLoggingOut} onClick={handleLogout}>
            <Icon icon={LogOut} />
          </Button>
        </>
      ) : (
        <>
          <Button variant="ghost" onClick={() => handleNavigate("/login")}> {t("common.logIn")} </Button>

          <Button onClick={() => handleNavigate("/signup")}>{t("Navbar.signUp")}</Button>
        </>
      )}

      {shouldShowCurrentWorkout && (
        <div className={styles.currentWorkout}>
          <Button variant="ghost" onClick={handleCurrentWorkout}>
            <Icon icon={Dumbbell} /> {t("common.resumeWorkout")} </Button>

          <span className={styles.timerText}>
            <Icon icon={Timer} /> {formatElapsedDuration(timerState.elapsedTime)}
          </span>
        </div>
      )}
    </>
  );

  return (
    <>
    <nav ref={navRef} className={styles.navbar} aria-label={t("Navbar.headerNavigation")}>
      <div className={styles.inner}>
        <div className={styles.leftSide}>
          <button
            className={styles.brand}
            aria-label={t("Navbar.workoutHome")}
            type="button"
            onClick={() => handleNavigate("/")}
          >
            <img
              src="/moose_charging_kettlebell_clean_transparent.png"
              alt={t("Navbar.mooseLogo")}
              className={styles.logo}
            />
            <span>{t("common.workout")}</span>
          </button>

          <div className={styles.links}>{navLinks}</div>
        </div>

        <div className={styles.actions}>{authActions}</div>

        <div className={styles.headerControls}>
        <button
          type="button"
          className={styles.menuButton}
          ref={menuButtonRef}
          onClick={() => setMenuLocation(isMenuOpen ? null : locationKey)}
          aria-label={isMenuOpen ? t("Navbar.closeMenu") : t("Navbar.openMenu")}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-menu"
        >
          <Icon icon={isMenuOpen ? X : Menu} />
        </button></div>
      </div>

      {logoutError && <p className={styles.logoutError} role="alert">{translateMessage(logoutError)}</p>}
      <div
        id="mobile-menu"
        className={`${styles.mobileMenu} ${isMenuOpen ? styles.mobileMenuOpen : ""
          }`.trim()}
      >
        <div className={styles.mobileLinks}>{navLinks}
          {isAuthenticated && <NavLink to="/create-exercise" className={({ isActive }) => navLinkClass(isActive)} onClick={closeMenu}><Icon icon={Plus} /> {t("common.createExercise")}</NavLink>}
        </div>

        <div className={styles.mobileActions}>{authActions}</div>
      </div>
    </nav>
    {!isWorkoutPage && !isMenuOpen && <nav className={styles.bottomNav} aria-label={t("Navbar.mainNavigation")}>
      <NavLink to="/" className={({ isActive }) => navLinkClass(isActive)} onClick={closeMenu}><Icon icon={Home} /><span>{t("common.home")}</span></NavLink>
      <NavLink to="/templates" className={({ isActive }) => navLinkClass(isActive || /^\/(workout-select|exercise-select|workout-summary|workout-result)(\/|$)/.test(pathname))} onClick={closeMenu}><Icon icon={Dumbbell} /><span>{t("common.workouts")}</span></NavLink>
      {isAuthenticated ? <NavLink to="/profile/workouts" className={({ isActive }) => navLinkClass(isActive)} onClick={closeMenu}><Icon icon={History} /><span>{t("common.history")}</span></NavLink> : <NavLink to="/library" className={({ isActive }) => navLinkClass(isActive)} onClick={closeMenu}><Icon icon={BookOpen} /><span>{t("common.library")}</span></NavLink>}
      <NavLink to={isAuthenticated ? "/profile" : "/login"} className={({ isActive }) => navLinkClass(isActive || (isAuthenticated && pathname.startsWith("/profile/") && !pathname.startsWith("/profile/workouts")))} onClick={closeMenu} end><Icon icon={UserRound} /><span>{isAuthenticated ? t("common.profile") : t("common.logIn")}</span></NavLink>
    </nav>}
    </>
  );
}
