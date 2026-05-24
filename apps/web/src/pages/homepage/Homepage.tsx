import { useNavigate } from "react-router-dom";
import Box from "../../components/ui/box/Box";
import Button from "../../components/ui/button/Button";


import styles from "./Homepage.module.css";


export default function Homepage() {
  const navigate = useNavigate();

  return (
    <Box component="main" className={styles.page}>
      <section className={styles.intro}>
        <p className={styles.kicker}>Workout App</p>

        <h1 className={styles.title}>Build and track your workouts.</h1>

        <p className={styles.subtitle}>
          Choose muscles, select exercises, save templates, and keep track of your sessions.
        </p>

        <div className={styles.actions}>
          <Button onClick={() => navigate("/workout-select")}>
            Start workout
          </Button>

          <Button variant="ghost" onClick={() => navigate("/library")}>
            Browse exercises
          </Button>
        </div>
      </section>

      <section className={styles.section}>
        <h2>What you can do</h2>

        <ul className={styles.linkList}>
          <li>
            <button type="button" onClick={() => navigate("/library")}>
              Browse the exercise library
            </button>
          </li>

          <li>
            <button type="button" onClick={() => navigate("/templates")}>
              View workout templates
            </button>
          </li>

          <li>
            <button type="button" onClick={() => navigate("/workout-select")}>
              Start a new workout
            </button>
          </li>
        </ul>
      </section>
    </Box>
  );
}