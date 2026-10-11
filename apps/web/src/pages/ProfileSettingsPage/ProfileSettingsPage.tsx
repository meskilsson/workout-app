import { useTranslation } from "react-i18next";
import { t } from "../../i18n";
import { friendlyError } from "../../utils/formValidation";
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
    useTranslation();
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
            setDeleteError(t("ProfileSettingsPage.couldNotFindTheCurrentUser"));
            return;
        }

        setDeleteError("");

        try {
            await deleteMutation.mutateAsync(user._id);

            navigate("/");
        } catch (error) {
            if (error instanceof Error) {
                setDeleteError(friendlyError(error));
            } else {
                setDeleteError(t("common.failedToDeleteAccount"));
            }
        }
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>{t("ProfileSettingsPage.accountSettings")}</h1>
                    <p className={styles.subtitle}> {t("ProfileSettingsPage.manageYourAccountAndTrainingPreferences")} </p>

                    <Button
                        type="button"
                        variant="secondary"
                        style={{ minWidth: "3.25rem", marginTop: "1rem" }}
                        iconOnly
                        className={styles.backButton}
                    aria-label={t("common.goBack")}
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
                        <h3 className={styles.settingsTitle}>{t("ProfileSettingsPage.musclePreviewModel")}</h3>
                        <p className={styles.sectionText}> {t("ProfileSettingsPage.thisChangesTheBodyModelUsedOnExerciseCards")} </p>
                    </div>

                    <BodyModelSelect />
                </Card>
            </section>

            <section className={styles.section}>
                <Card className={styles.settingsCard}>
                    <div>
                        <h3 className={styles.settingsTitle}>{t("ProfileSettingsPage.currentSession")}</h3>
                        <p className={styles.sectionText}> {t("ProfileSettingsPage.youAreCurrentlySignedInAs")}{" "}
                            {user?.username ? `@${user.username}` : t("ProfileSettingsPage.thisUser")}.
                        </p>
                    </div>

                    <Button variant="secondary" onClick={logout}> {t("common.logOut")} </Button>
                </Card>
            </section>

            <section className={styles.section}>
                <Card className={`${styles.settingsCard} ${styles.dangerCard}`}>
                    <div>
                        <h3 className={styles.dangerTitle}>{t("common.deleteAccount")}</h3>

                    </div>

                    <Button
                        type="button"
                        variant="danger" icon={Trash2}
                        onClick={() => setIsDeleteModalOpen(true)}
                    > {t("common.deleteAccount")} </Button>
                </Card>
            </section>

            <Modal
                title={t("ProfileSettingsPage.deleteAccount")}
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
                        > {t("common.cancel")} </Button>

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
                                    label={t("common.deleting")}
                                    showLabel
                                />
                            ) : (
                                t("common.deleteAccount")
                            )}
                        </Button>
                    </>
                }
            >
                <p className={styles.modalText}> {t("ProfileSettingsPage.deleteYourAccountPermanentlyThisCannotBeUndone")} </p>

                {deleteError && (
                    <p className={styles.errorText}>
                        {deleteError}
                    </p>
                )}
            </Modal>
        </div>
    );
}
