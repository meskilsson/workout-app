import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import { t } from "../../i18n";
import workoutPalette from "../../pages/WorkoutPage/WorkoutPalette.module.css";
import { LoadingHandoff } from "../motion/LoadingHandoff";
import { motion, useAnimationControls } from "motion/react";
import { useEffect, useRef } from "react";
import { useReducedMotion } from "../motion/useReducedMotion";
import { useMotionTransition } from "../motion/useMotionTransition";
import { Mail, CodeXml, BriefcaseBusiness } from "lucide-react";
import Icon from "../ui/icon/Icon";
import { Outlet } from "../../routes/navigation";
import { useLocation, useParams } from "../../routes/navigationHooks";
import { useVisibleViewport } from "../../hooks/useVisibleViewport";
import Footer from "./Footer";
import Navbar from "./Navbar";
import RestTimer from "../timer/RestTimer";
import Box from "../ui/box/Box";
import styles from "./Layout.module.css";
import WebRestTimerProvider from "../timer/WebRestTimerProvider";

export default function Layout() {
    const { sessionExpired } = useAuth();
    const { i18n } = useTranslation();
    const language = i18n.resolvedLanguage;
    const previousLanguage = useRef(language);
    const languageAnimation = useAnimationControls();
    const layoutRef = useRef<HTMLDivElement>(null);
    const reducedMotion = useReducedMotion();
    useEffect(() => {
      if (previousLanguage.current !== language && !reducedMotion) {
        const shadow = layoutRef.current ? getComputedStyle(layoutRef.current).getPropertyValue("--language-change-shadow").trim() : "rgba(128, 128, 128, 0.16)";
        void languageAnimation.start({ textShadow: ["0px 0px 0px rgba(128, 128, 128, 0)", `0px 1px 3px ${shadow}`, "0px 0px 0px rgba(128, 128, 128, 0)"], transition: { duration: 0.36, ease: "easeInOut" } });
      } else languageAnimation.set({ textShadow: "0px 0px 0px rgba(128, 128, 128, 0)" });
      previousLanguage.current = language;
      return () => languageAnimation.stop();
    }, [language, reducedMotion, languageAnimation]);
  const transition = useMotionTransition();
  useVisibleViewport();
  const { pathname } = useLocation();
  const { draftId } = useParams();
  const isWorkoutPage = pathname === `/workout/${draftId}`;

  return (
    <WebRestTimerProvider>
      <motion.div ref={layoutRef} initial={false} animate={languageAnimation} className={`${styles.appLayout} ${isWorkoutPage ? workoutPalette.palette : ""}`}>
        <Navbar />
        {sessionExpired && <p role="status" className={styles.sessionNotice}>{t("auth.sessionExpired")}</p>}
        <a href="#main-content" className={styles.skipLink}>{t("Layout.skipToContent")}</a>

        <LoadingHandoff className={styles.main}>
          <Outlet />
        </LoadingHandoff>

        {isWorkoutPage ? (
          <Footer className={styles.timerFooter}>
            <Box className={styles.timerBox}>
              <RestTimer />
            </Box>
          </Footer>
        ) : (
          <Footer className={styles.footer}>
            <Box className={styles.footerBox}>
              <div className={styles.about}>
                <p className={styles.footerText}>{t("Layout.workoutApp")} <span>{t("Layout.byMattiasEskilsson")}</span></p>
              </div>
              <section className={styles.contactBox}>

                <div className={styles.contact}>
                  <p className={styles.contactTitle}>{t("Layout.contact")}</p>
                  <div className={styles.contactLinks}>
                    <motion.a initial={false} animate={{ color: "var(--color-text-soft)" }} whileHover={{ color: "var(--color-primary-text)" }} transition={transition} href="mailto:mattiaseskilsson@hotmail.se" aria-label={t("common.email")}>
                      <Icon icon={Mail} />
                    </motion.a>
                    <motion.a initial={false} animate={{ color: "var(--color-text-soft)" }} whileHover={{ color: "var(--color-primary-text)" }} transition={transition} href="https://github.com/meskilsson" target="_blank" rel="noreferrer" aria-label={t("Layout.githubProfile")}>
                      <Icon icon={CodeXml} />
                    </motion.a>
                    <motion.a initial={false} animate={{ color: "var(--color-text-soft)" }} whileHover={{ color: "var(--color-primary-text)" }} transition={transition} href="https://www.linkedin.com/in/mattias-eskilsson-825200367/" target="_blank" rel="noreferrer"
                      aria-label={t("Layout.linkedinProfile")}>
                      <Icon icon={BriefcaseBusiness} />
                    </motion.a>
                  </div>
                </div>
              </section>
            </Box>
          </Footer>
        )}
      </motion.div>
    </WebRestTimerProvider>
  );
}
