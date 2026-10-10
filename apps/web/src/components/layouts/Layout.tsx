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
  useVisibleViewport();
  const { pathname } = useLocation();
  const { draftId } = useParams();
  const isWorkoutPage = pathname === `/workout/${draftId}`;

  return (
    <WebRestTimerProvider>
      <div className={styles.appLayout}>
        <Navbar />
        <a href="#main-content" className={styles.skipLink}>Skip to content</a>

        <main id="main-content" tabIndex={-1} className={styles.main}>
          <Outlet />
        </main>

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
                    <a href="mailto:mattiaseskilsson@hotmail.se" aria-label="Email">
                      <Icon icon={Mail} />
                    </a>
                    <a href="https://github.com/meskilsson" target="_blank" rel="noreferrer" aria-label="GitHub profile">
                      <Icon icon={CodeXml} />
                    </a>
                    <a href="https://www.linkedin.com/in/mattias-eskilsson-825200367/" target="_blank" rel="noreferrer"
                      aria-label="LinkedIn profile">
                      <Icon icon={BriefcaseBusiness} />
                    </a>
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
