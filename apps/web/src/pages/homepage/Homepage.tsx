import { useNavigate } from "react-router-dom";
import Box from "../../components/ui/box/Box";
import Button from "../../components/ui/button/Button";
import Card from "../../components/ui/cards/Card";

import dumbellImage from "../../components/ui/cards/cardimages/dumbell-chalk.webp";

import styles from "./Homepage.module.css";


export default function Homepage() {
  const navigate = useNavigate();

  return (
    <Box className={styles.homepage}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <p className={styles.eyebrow}>Train smarter</p>

            <h1 className={styles.title}>
              Build workouts that fit your goals.
            </h1>

            <p className={styles.subtitle}>
              Create exercises, save workout templates, and start your next
              training session faster.
            </p>

            <div className={styles.heroActions}>
              <Button onClick={() => navigate("/workout-select")}>
                Start Workout
              </Button>

              <Button variant="ghost" onClick={() => navigate("/templates")}>
                View Templates
              </Button>
            </div>
          </div>

          <Card className={styles.previewCard}>
            <div className={styles.previewImageWrapper}>
              <img
                src={dumbellImage}
                alt="Dumbbell with chalk"
                className={styles.previewImage}
              />
            </div>

            <div className={styles.previewContent}>
              <h2>Today&apos;s session</h2>
              <p>Choose muscle groups and build your next workout.</p>
            </div>
          </Card>
        </div>
      </section>

      <section className={styles.features}>
        <Card className={styles.featureCard}>
          <h2>Build workouts</h2>
          <p>Create sessions based on the muscles you want to train.</p>
        </Card>

        <Card className={styles.featureCard}>
          <h2>Save templates</h2>
          <p>Reuse your favorite workout structures anytime.</p>
        </Card>

        <Card className={styles.featureCard}>
          <h2>Track progress</h2>
          <p>Keep your training organized as your app grows.</p>
        </Card>
      </section>
    </Box>
  );
}