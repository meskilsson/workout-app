import { Outlet, useLocation } from "react-router-dom";
import Footer from "./Footer";
import Navbar from "./Navbar";
import RestTimer from "../timer/RestTimer";
import Box from "../ui/box/Box";
import styles from "./Layout.module.css";
import { RestTimerProvider } from "@workout-app/shared/timer/rest";

export default function Layout() {
  const { pathname } = useLocation();
  const isWorkoutPage = pathname === "/workout";

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
              <p className={styles.footerText}>Workout App</p>
            </Box>
          </Footer>
        )}
      </div>
    </RestTimerProvider>
  );
}