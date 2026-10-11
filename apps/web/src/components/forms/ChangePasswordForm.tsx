import { reportFormError, friendlyError } from "../../utils/formValidation";
import ValidatedForm from "./ValidatedForm";
import { useMutation } from "@tanstack/react-query";
import { changePasswordRequest } from "../../services/userApi";
import { useAuth } from "../../context/AuthContext";
import { useState } from "react";
import styles from "./AccountForm.module.css";
import Button from "../ui/button/Button";
import LoadingPredator from "../Loading/LoadingPredator";


export default function ChangePasswordForm() {
    const { user: authUser } = useAuth();

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [success, setSuccess] = useState("");
    const passwordMutation = useMutation({
        mutationFn: (data: Parameters<typeof changePasswordRequest>[1]) => changePasswordRequest(authUser?._id ?? "", data),
        gcTime: 0,
    });
    const isLoading = passwordMutation.isPending;
    const [error, setError] = useState("");


    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const submittedForm = event.currentTarget;
        if (isLoading) return;

        if (!authUser?._id) return;

        setError("");
        setSuccess("");
        try {
            await passwordMutation.mutateAsync({
                currentPassword,
                newPassword,
            });

            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");

            setSuccess("Password updated successfully.");
        } catch (error) {
            if (!reportFormError(submittedForm, error)) setError(friendlyError(error, "Unable to update your account. Please try again."));
        } finally {
            passwordMutation.reset();
        }
    }

    return (
        <section className={styles.section}>
            <h2>Change password</h2>

            <ValidatedForm onSubmit={handleSubmit}>
                <label htmlFor="currentPassword">Current password</label>
                <input
                    id="currentPassword" name="currentPassword"
                    autoComplete="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    required
                />

                <label htmlFor="newPassword">New password</label>
                <input
                    id="newPassword" name="newPassword" minLength={8} maxLength={100}
                    autoComplete="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    required
                />

                <label htmlFor="confirmPassword">Confirm new password</label>
                <input
                    id="confirmPassword" name="confirmPassword" minLength={8} maxLength={100}
                    autoComplete="new-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                />

                {error && <p id="password-change-error" className={styles.error} role="alert">{error}</p>}
                {success && <p className={styles.success} role="status">{success}</p>}

                <Button variant="primary" type="submit" disabled={isLoading}>
                    {isLoading ? (
                        <LoadingPredator
                            size="small"
                            color="currentColor"
                            label="Updating..."
                            showLabel
                        />
                    ) : (
                        "Update password"
                    )}
                </Button>
            </ValidatedForm>
        </section>
    );
}
