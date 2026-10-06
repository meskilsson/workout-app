import { changePasswordRequest } from "../../services/userApi";
import { useAuth } from "../../context/AuthContext";
import { useState } from "react";
import styles from "./AccountForm.module.css";
import Button from "../ui/button/Button";
import LoadingPredator from "../Loading/LoadingPredator";
import { focusInvalidField } from "../../utils/focusInvalidField";

export default function ChangePasswordForm() {
    const { user: authUser } = useAuth();

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [success, setSuccess] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [invalidField, setInvalidField] = useState("");

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (isLoading) return;

        if (!authUser?._id) return;

        setError("");
        setSuccess("");
        setInvalidField("");

        if (newPassword !== confirmPassword) {
            setError("New passwords do not match.");
            setInvalidField("confirmPassword");
            focusInvalidField(event.currentTarget);
            return;
        }

        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters.");
            setInvalidField("newPassword");
            focusInvalidField(event.currentTarget);
            return;
        }

        setIsLoading(true);

        try {
            await changePasswordRequest(authUser._id, {
                currentPassword,
                newPassword,
            });

            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");

            setSuccess("Password updated successfully.");
        } catch (error) {
            setError(
                error instanceof Error ? error.message : "Failed to update password"
            );
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <section className={styles.section}>
            <h2>Change password</h2>

            <form onSubmit={handleSubmit}>
                <label htmlFor="currentPassword">Current password</label>
                <input
                    id="currentPassword"
                    autoComplete="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    required
                />

                <label htmlFor="newPassword">New password</label>
                <input
                    id="newPassword"
                    aria-invalid={invalidField === "newPassword" || undefined}
                    aria-describedby={invalidField === "newPassword" ? "password-change-error" : undefined}
                    autoComplete="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    required
                />

                <label htmlFor="confirmPassword">Confirm new password</label>
                <input
                    id="confirmPassword"
                    aria-invalid={invalidField === "confirmPassword" || undefined}
                    aria-describedby={invalidField === "confirmPassword" ? "password-change-error" : undefined}
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
            </form>
        </section>
    );
}
