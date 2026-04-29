import Card from "../../components/ui/cards/Card";
import { useAuth } from "../../context/AuthContext";
import styles from "./ProfilePage.module.css";

export default function ProfilePage() {
    const { user } = useAuth();

    if (!user) {
        return (
            <div className={styles.page}>
                <Card className={styles.stateCard}>
                    <p className={styles.stateText}>No user found.</p>
                </Card>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <p className={styles.kicker}>Profile</p>
                    <h2 className={styles.title}>Your profile</h2>
                    <p className={styles.subtitle}>
                        View your account information. Training stats can be added here later.
                    </p>
                </div>
            </div>

            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <div>
                        <h3 className={styles.sectionTitle}>Account information</h3>
                        <p className={styles.sectionText}>
                            Your basic account details.
                        </p>
                    </div>
                </div>

                <div className={styles.infoGrid}>
                    <Card className={styles.infoCard}>
                        <span className={styles.infoLabel}>Name</span>
                        <strong className={styles.infoValue}>{user.name}</strong>
                    </Card>

                    <Card className={styles.infoCard}>
                        <span className={styles.infoLabel}>Username</span>
                        <strong className={styles.infoValue}>@{user.username}</strong>
                    </Card>

                    <Card className={styles.infoCard}>
                        <span className={styles.infoLabel}>Email</span>
                        <strong className={styles.infoValue}>{user.email}</strong>
                    </Card>

                    <Card className={styles.infoCard}>
                        <span className={styles.infoLabel}>Role</span>
                        <strong className={styles.infoValue}>{user.role}</strong>
                    </Card>
                </div>
            </section>

            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <div>
                        <h3 className={styles.sectionTitle}>Training stats</h3>
                        <p className={styles.sectionText}>
                            Coming soon: workout count, streaks, total volume, favorite exercises, and personal records.
                        </p>
                    </div>
                </div>

                <div className={styles.statsGrid}>
                    <Card className={styles.statCard}>
                        <span className={styles.statLabel}>Workouts</span>
                        <strong className={styles.statValue}>Soon</strong>
                    </Card>

                    <Card className={styles.statCard}>
                        <span className={styles.statLabel}>Total volume</span>
                        <strong className={styles.statValue}>Soon</strong>
                    </Card>

                    <Card className={styles.statCard}>
                        <span className={styles.statLabel}>Streak</span>
                        <strong className={styles.statValue}>Soon</strong>
                    </Card>
                </div>
            </section>
        </div>
    );
}