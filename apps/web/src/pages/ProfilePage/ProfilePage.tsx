import { ArrowLeft } from "lucide-react";
import Icon from "../../components/ui/icon/Icon";
import Card from "../../components/ui/cards/Card";
import { useAuth } from "../../context/AuthContext";
import styles from "./ProfilePage.module.css";
import Button from "../../components/ui/button/Button";
import { useNavigate } from "../../routes/navigationHooks";


export default function ProfilePage() {
    const { user } = useAuth();
    const navigate = useNavigate();

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
                    <h1 className={styles.title}>Your profile</h1>
                    <p className={styles.subtitle}>
                        Your account details, in one place.
                    </p>

                    <Button
                        type="button"
                        variant="secondary"
                        style={{ minWidth: "3.25rem", marginTop: "1rem" }}
                        iconOnly
                        className={styles.backButton}
                    aria-label="Go back"
                        onClick={() => navigate(-1)}

                    >
                        <Icon icon={ArrowLeft} />
                    </Button>
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

                <dl className={styles.infoGrid}>
                    <div className={styles.infoCard}><dt className={styles.infoLabel}>Name</dt><dd className={styles.infoValue}>{user.name}</dd></div>
                    <div className={styles.infoCard}><dt className={styles.infoLabel}>Username</dt><dd className={styles.infoValue}>@{user.username}</dd></div>
                    <div className={styles.infoCard}><dt className={styles.infoLabel}>Email</dt><dd className={styles.infoValue}>{user.email}</dd></div>
                </dl>
            </section>


        </div>
    );
}
