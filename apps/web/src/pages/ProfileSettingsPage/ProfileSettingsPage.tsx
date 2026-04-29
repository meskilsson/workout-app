import Card from "../../components/ui/cards/Card";
import Button from "../../components/ui/button/Button";
import { useAuth } from "../../context/AuthContext";
import ChangePasswordForm from "../../components/forms/ChangePasswordForm";
import UpdateAccountForm from "../../components/forms/UpdateAccountForm";
import styles from "./ProfileSettingsPage.module.css";

export default function ProfileSettingsPage() {
    const { user, logout } = useAuth();

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <p className={styles.kicker}>Settings</p>
                    <h2 className={styles.title}>Account settings</h2>
                    <p className={styles.subtitle}>
                        Manage your profile details, password, session, and account deletion.
                    </p>
                </div>
            </div>

            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <div>
                        <h3 className={styles.sectionTitle}>Profile details</h3>
                        <p className={styles.sectionText}>
                            Update your name, username, or email address.
                        </p>
                    </div>
                </div>

                <Card className={`${styles.settingsCard} ${styles.formCard}`}>
                    <UpdateAccountForm />
                </Card>
            </section>

            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <div>
                        <h3 className={styles.sectionTitle}>Security</h3>
                        <p className={styles.sectionText}>
                            Change your password to keep your account secure.
                        </p>
                    </div>
                </div>

                <Card className={`${styles.settingsCard} ${styles.formCard}`}>
                    <ChangePasswordForm />
                </Card>
            </section>

            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <div>
                        <h3 className={styles.sectionTitle}>Session</h3>
                        <p className={styles.sectionText}>
                            Log out from your current account.
                        </p>
                    </div>
                </div>

                <Card className={styles.settingsCard}>
                    <div>
                        <h3 className={styles.settingsTitle}>Current session</h3>
                        <p className={styles.sectionText}>
                            You are currently signed in as{" "}
                            {user?.username ? `@${user.username}` : "this user"}.
                        </p>
                    </div>

                    <Button variant="secondary" onClick={logout}>
                        Log out
                    </Button>
                </Card>
            </section>

            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <div>
                        <h3 className={styles.sectionTitle}>Danger zone</h3>
                        <p className={styles.sectionText}>
                            Permanent account actions.
                        </p>
                    </div>
                </div>

                <Card className={`${styles.settingsCard} ${styles.dangerCard}`}>
                    <div>
                        <h3 className={styles.dangerTitle}>Delete account</h3>
                        <p className={styles.sectionText}>
                            Permanently delete your account and all related profile data.
                        </p>
                    </div>

                    <Button variant="danger" disabled>
                        Delete account
                    </Button>
                </Card>
            </section>
        </div>
    );
}