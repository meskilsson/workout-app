import { translateMessage, t } from "../../i18n";
import { useTranslation } from "react-i18next";
import { reportFormError, friendlyError } from "../../utils/formValidation";
import ValidatedForm from "./ValidatedForm";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authKey } from "../../query/queryClient";
import type { User } from "../../services/authApi";
import { updateUserRequest } from "../../services/userApi";
import { useAuth } from "../../context/AuthContext";
import type { UpdateUserBody } from "@workout-app/shared";
import styles from "./AccountForm.module.css";
import Button from "../ui/button/Button";
import LoadingPredator from "../Loading/LoadingPredator";

export default function UpdateAccountForm() {
    useTranslation();
    const { user } = useAuth();
    return user ? <AccountDetailsForm key={user._id} initialUser={user} /> : null;
}

function AccountDetailsForm({ initialUser }: { initialUser: User }) {
    useTranslation();
    const { user: authUser, updateAuthUser } = useAuth();
    const client = useQueryClient();

    const [name, setName] = useState(initialUser.name ?? "");
    const [username, setUsername] = useState(initialUser.username ?? "");
    const [email, setEmail] = useState(initialUser.email ?? "");

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const updateMutation = useMutation({
        mutationFn: (data: UpdateUserBody) => updateUserRequest(initialUser._id, data),
        onSuccess: updatedUser => {
            if (client.getQueryData<User>(authKey)?._id === initialUser._id) updateAuthUser(updatedUser);
        },
    });
    const isLoading = updateMutation.isPending;

    async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
        e.preventDefault();
        const submittedForm = e.currentTarget;
        if (isLoading) return;

        if (!authUser?._id) return;

        setError("");
        setSuccess("");

        try {
            const userData: UpdateUserBody = {
                name,
                username,
                email,
            };

            await updateMutation.mutateAsync(userData);

            setSuccess(t("UpdateAccountForm.accountUpdatedSuccessfully"));
        } catch (error) {
            if (!reportFormError(submittedForm, error)) setError(friendlyError(error, t("common.unableToUpdateYourAccountPleaseTryAgain")));
        }
    }

    return (
        <section className={styles.section}>
            <h2>{t("UpdateAccountForm.updateAccount")}</h2>
            <p>{t("UpdateAccountForm.changeYourNameUsernameOrEmailAddress")}</p>

            <ValidatedForm onSubmit={handleSubmit}>
                <label> {t("common.name")} <input
                        type="text"
                        autoComplete="name"
                        name="name" required minLength={2} maxLength={50} value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </label>

                <label> {t("common.username")} <input
                        type="text"
                        name="username" required minLength={3} maxLength={20} pattern="[a-zA-Z0-9_]+" data-validation-hint={t("common.useLettersNumbersAndUnderscoresOnly")} value={username}
                        autoComplete="username"
                        autoCapitalize="none"
                        spellCheck={false}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                </label>

                <label> {t("common.email")} <input
                        type="email"
                        autoComplete="email"
                        autoCapitalize="none"
                        name="email" required value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </label>

                {error && <p className={styles.error} role="alert">{translateMessage(error)}</p>}
                {success && <p className={styles.success} role="status">{translateMessage(success)}</p>}

                <Button variant="primary" type="submit" disabled={isLoading}>
                    {isLoading ? (
                        <LoadingPredator
                            size="small"
                            color="currentColor"
                            label={t("common.saving")}
                            showLabel
                        />
                    ) : (
                        t("common.saveChanges")
                    )}
                </Button>
            </ValidatedForm>
        </section>
    );
}
