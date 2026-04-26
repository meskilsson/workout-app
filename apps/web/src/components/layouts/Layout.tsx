import { Outlet, useLocation } from "react-router-dom";
import Footer from "./Footer";
import Navbar from "./Navbar";
import RestTimer from "../timer/RestTimer";
import Box from "../ui/box/Box";
import styles from "./Layout.module.css";

export default function Layout() {
  const { pathname } = useLocation();
  const isWorkoutPage = pathname === "/workout";

  return (
    <div className={styles.appLayout}>
      <Navbar />

      <main className={styles.main}>
        <Outlet />
      </main>

      {isWorkoutPage ? (
        <Footer className="timer-footer">
          <Box className="timer-box">
            <RestTimer />
          </Box>
        </Footer>
      ) : (
        <Footer>
          <Box>

          </Box>
        </Footer>
      )}
    </div>
  );
}