import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Trash2 } from "lucide-react";
import Icon from "../../components/ui/icon/Icon";
import Card from "../../components/ui/cards/Card";
import Button from "../../components/ui/button/Button";
import { useAuth } from "../../context/AuthContext";
import ChangePasswordForm from "../../components/forms/ChangePasswordForm";
import UpdateAccountForm from "../../components/forms/UpdateAccountForm";
import styles from "./ProfileSettingsPage.module.css";
import BodyModelSelect from "../../components/bodyModel/BodyModelSelect";
import { useNavigate } from "../../routes/navigationHooks";
import { useState } from "react";
import Modal from "../../components/ui/modal/Modal";
import { deleteUserRequest } from "../../services/userApi";
import LoadingPredator from "../../components/Loading/LoadingPredator";

export default function ProfileSettingsPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const deleteMutation = useMutation({
        mutationFn: async (userId: string) => {
            await deleteUserRequest(userId);
            await logout();
        },
    });
    const isDeletingAccount = deleteMutation.isPending;
    const [deleteError, setDeleteError] = useState("");


    async function handleConfirmDeleteAccount() {
        if (!user?._id) {
            setDeleteError("Could not find the current user.");
            return;
        }

        setDeleteError("");

        try {
            await deleteMutation.mutateAsync(user._id);

            navigate("/");
        } catch (error) {
            if (error instanceof Error) {
                setDeleteError(error.message);
            } else {
                setDeleteError("Failed to delete account");
            }
        }
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Account settings</h1>
                    <p className={styles.subtitle}>
                        Manage your account and training preferences.
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
                <Card className={`${styles.settingsCard} ${styles.formCard}`}>
                    <UpdateAccountForm />
                </Card>
            </section>

            <section className={styles.section}>
                <Card className={`${styles.settingsCard} ${styles.formCard}`}>
                    <ChangePasswordForm />
                </Card>
            </section>

            <section className={styles.section}>
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
                <Card className={`${styles.settingsCard} ${styles.dangerCard}`}>
                    <div>
                        <h3 className={styles.dangerTitle}>Delete account</h3>

                    </div>

                    <Button
                        type="button"
                        variant="danger" icon={Trash2}
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
                            variant="danger" icon={Trash2}
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
                    Delete your account permanently? This cannot be undone.
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
