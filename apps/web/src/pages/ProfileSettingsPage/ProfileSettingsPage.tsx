import Card from "../../components/ui/cards/Card";
import Button from "../../components/ui/button/Button";
import { useAuth } from "../../context/AuthContext";
import ChangePasswordForm from "../../components/forms/ChangePasswordForm";
import UpdateAccountForm from "../../components/forms/UpdateAccountForm";
import styles from "./ProfileSettingsPage.module.css";
import BodyModelSelect from "../../components/bodyModel/BodyModelSelect";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import Modal from "../../components/ui/modal/Modal";
import { deleteUserRequest } from "../../services/userApi";
import LoadingPredator from "../../components/Loading/LoadingPredator";

export default function ProfileSettingsPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);
    const [deleteError, setDeleteError] = useState("");


    async function handleConfirmDeleteAccount() {
        if (!user?._id) {
            setDeleteError("Could not find the current user.");
            return;
        }

        setIsDeletingAccount(true);
        setDeleteError("");

        try {
            await deleteUserRequest(user._id);
            await logout();

            navigate("/");
        } catch (error) {
            if (error instanceof Error) {
                setDeleteError(error.message);
            } else {
                setDeleteError("Failed to delete account");
            }
        } finally {
            setIsDeletingAccount(false);
        }
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <p className={styles.kicker}>Settings</p>
                    <h2 className={styles.title}>Account settings</h2>
                    <p className={styles.subtitle}>
                        Manage your profile details, password, session, and account deletion.
                    </p>

                    <Button
                        type="button"
                        variant="secondary"
                        style={{ minWidth: "3.25rem", marginTop: "1rem" }}
                        className={styles.backButton}
                        onClick={() => navigate(-1)}

                    >
                        <span className={styles.buttonArrow}>←</span>
                    </Button>
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
                        <h3 className={styles.sectionTitle}>Body model</h3>
                        <p className={styles.sectionText}>
                            Choose which body model is used for muscle previews.
                        </p>
                    </div>
                </div>

                <Card className={styles.settingsCard}>
                    <div>
                        <h3 className={styles.settingsTitle}>Muscle preview model</h3>
                        <p className={styles.sectionText}>
                            This changes the body model used on exercise cards and workout results.
                        </p>
                    </div>

                    <BodyModelSelect />
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

                    </div>
                </div>

                <Card className={`${styles.settingsCard} ${styles.dangerCard}`}>
                    <div>
                        <h3 className={styles.dangerTitle}>Delete account</h3>

                    </div>

                    <Button
                        type="button"
                        variant="danger"
                        onClick={() => setIsDeleteModalOpen(true)}
                    >
                        Delete account
                    </Button>
                </Card>
            </section>

            <Modal
                title="Delete account?"
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    if (!isDeletingAccount) {
                        setIsDeleteModalOpen(false);
                    }
                }}
                actions={
                    <>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setIsDeleteModalOpen(false)}
                            disabled={isDeletingAccount}
                        >
                            Cancel
                        </Button>

                        <Button
                            type="button"
                            variant="danger"
                            onClick={handleConfirmDeleteAccount}
                            disabled={isDeletingAccount}
                        >
                            {isDeletingAccount ? (
                                <LoadingPredator
                                    size="small"
                                    color="currentColor"
                                    label="Deleting..."
                                    showLabel
                                />
                            ) : (
                                "Delete account"
                            )}
                        </Button>
                    </>
                }
            >
                <p className={styles.modalText}>
                    Are you sure you want to delete your account?
                </p>

                {deleteError && (
                    <p className={styles.errorText}>
                        {deleteError}
                    </p>
                )}
            </Modal>
        </div>
    );
}