import workoutPalette from "../../pages/WorkoutPage/WorkoutPalette.module.css";
import { LoadingHandoff } from "../motion/LoadingHandoff";
import { motion } from "motion/react";
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
  const transition = useMotionTransition();
  useVisibleViewport();
  const { pathname } = useLocation();
  const { draftId } = useParams();
  const isWorkoutPage = pathname === `/workout/${draftId}`;

  return (
    <WebRestTimerProvider>
      <div className={`${styles.appLayout} ${isWorkoutPage ? workoutPalette.palette : ""}`}>
        <Navbar />
        <a href="#main-content" className={styles.skipLink}>Skip to content</a>

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
                <p className={styles.footerText}>Workout App <span>by Mattias Eskilsson</span></p>
              </div>
              <section className={styles.contactBox}>

                <div className={styles.contact}>
                  <p className={styles.contactTitle}>Contact</p>
                  <div className={styles.contactLinks}>
                    <motion.a initial={false} animate={{ color: "var(--color-text-soft)" }} whileHover={{ color: "var(--color-primary-text)" }} transition={transition} href="mailto:mattiaseskilsson@hotmail.se" aria-label="Email">
                      <Icon icon={Mail} />
                    </motion.a>
                    <motion.a initial={false} animate={{ color: "var(--color-text-soft)" }} whileHover={{ color: "var(--color-primary-text)" }} transition={transition} href="https://github.com/meskilsson" target="_blank" rel="noreferrer" aria-label="GitHub profile">
                      <Icon icon={CodeXml} />
                    </motion.a>
                    <motion.a initial={false} animate={{ color: "var(--color-text-soft)" }} whileHover={{ color: "var(--color-primary-text)" }} transition={transition} href="https://www.linkedin.com/in/mattias-eskilsson-825200367/" target="_blank" rel="noreferrer"
                      aria-label="LinkedIn profile">
                      <Icon icon={BriefcaseBusiness} />
                    </motion.a>
                  </div>
                </div>
              </section>
            </Box>
          </Footer>
        )}
      </div>
    </WebRestTimerProvider>
  );
}
