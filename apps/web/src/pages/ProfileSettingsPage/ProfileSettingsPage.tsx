import Card from "../../components/ui/cards/Card";
import Button from "../../components/ui/button/Button";
import { useAuth } from "../../context/AuthContext";
import styles from '../ProfilePage/ProfilePage.module.css';

export default function ProfileSettingsPage() {
    const { logout } = useAuth();

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <p className={styles.kicker}>Settings</p>
                    <h2 className={styles.title}>Account settings</h2>
                    <p className={styles.subtitle}>
                        Manage your account preferences.
                    </p>
                </div>
            </div>

            <Card className={styles.settingsCard}>
                <div>
                    <h3 className={styles.settingsTitle}>Session</h3>
                    <p className={styles.sectionText}>
                        Log out from your current account.
                    </p>
                </div>

                <Button variant="secondary" onClick={logout}>
                    Log out
                </Button>
            </Card>
        </div>
    );
}