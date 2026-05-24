import { Outlet, useLocation, useParams } from "react-router-dom";
import Footer from "./Footer";
import Navbar from "./Navbar";
import RestTimer from "../timer/RestTimer";
import Box from "../ui/box/Box";
import styles from "./Layout.module.css";
import { RestTimerProvider } from "@workout-app/shared/timer/rest";

export default function Layout() {
  const { pathname } = useLocation();
  const { draftId } = useParams();
  const isWorkoutPage = pathname === `/workout/${draftId}`;

  return (
    <RestTimerProvider>
      <div className={styles.appLayout}>
        <Navbar />

        <main className={styles.main}>
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
                <p className={styles.footerText}>Workout App <br /> made by <br /> <strong>Mattias Eskilsson</strong></p>
              </div>
              <section className={styles.contactBox}>

                <div className={styles.contact}>
                  <p className={styles.contactTitle}>Contact me</p>
                  <div className={styles.contactLinks}>
                    <a href="mailto:mattiaseskilsson@hotmail.se" aria-label="Email">
                      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path
                          d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2Zm0 2v.01L12 13l8-6.99V6l-8 6-8-6Z"
                          fill="currentColor" />
                      </svg>
                    </a>
                    <a href="https://github.com/meskilsson" target="_blank" rel="noreferrer" aria-label="GitHub profile">
                      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path
                          d="M12 2.75a9.25 9.25 0 0 0-2.93 18.02c.46.08.63-.2.63-.45v-1.58c-2.56.56-3.1-1.1-3.1-1.1-.42-1.07-1.03-1.35-1.03-1.35-.84-.58.06-.57.06-.57.93.07 1.42.96 1.42.96.83 1.42 2.18 1.01 2.71.77.08-.6.32-1.01.58-1.24-2.04-.23-4.18-1.02-4.18-4.54 0-1 .36-1.82.95-2.46-.1-.23-.42-1.17.09-2.43 0 0 .78-.25 2.55.94A8.8 8.8 0 0 1 12 7.7c.78 0 1.57.1 2.3.3 1.77-1.19 2.55-.94 2.55-.94.51 1.26.19 2.2.1 2.43.59.64.95 1.46.95 2.46 0 3.53-2.15 4.3-4.2 4.53.33.28.62.84.62 1.7v2.53c0 .25.17.53.64.44A9.25 9.25 0 0 0 12 2.75Z"
                          fill="currentColor" />
                      </svg>
                    </a>
                    <a href="https://www.linkedin.com/in/mattias-eskilsson-825200367/" target="_blank" rel="noreferrer"
                      aria-label="LinkedIn profile">
                      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path
                          d="M6.84 8.17a1.59 1.59 0 1 1 0-3.18 1.59 1.59 0 0 1 0 3.18Zm-1.37 2.11h2.74v8.78H5.47v-8.78Zm4.46 0h2.63v1.2h.04c.37-.69 1.27-1.42 2.6-1.42 2.78 0 3.29 1.83 3.29 4.21v4.79h-2.74v-4.24c0-1.01-.02-2.3-1.4-2.3-1.4 0-1.62 1.1-1.62 2.23v4.31H9.93v-8.78Z"
                          fill="currentColor" />
                      </svg>
                    </a>
                  </div>
                </div>
              </section>
            </Box>
          </Footer>
        )}
      </div>
    </RestTimerProvider>
  );
}