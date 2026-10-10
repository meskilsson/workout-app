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
    const { user } = useAuth();
    return user ? <AccountDetailsForm key={user._id} initialUser={user} /> : null;
}

function AccountDetailsForm({ initialUser }: { initialUser: User }) {
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

            setSuccess("Account updated successfully.");
        } catch (error) {
            setError(error instanceof Error ? error.message : "Failed to update account.");
        }
    }

    return (
        <section className={styles.section}>
            <h2>Update account</h2>
            <p>Change your name, username, or email address.</p>

            <form onSubmit={handleSubmit}>
                <label>
                    Name
                    <input
                        type="text"
                        autoComplete="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </label>

                <label>
                    Username
                    <input
                        type="text"
                        value={username}
                        autoComplete="username"
                        autoCapitalize="none"
                        spellCheck={false}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                </label>

                <label>
                    Email
                    <input
                        type="email"
                        autoComplete="email"
                        autoCapitalize="none"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </label>

                {error && <p className={styles.error} role="alert">{error}</p>}
                {success && <p className={styles.success} role="status">{success}</p>}

                <Button variant="primary" type="submit" disabled={isLoading}>
                    {isLoading ? (
                        <LoadingPredator
                            size="small"
                            color="currentColor"
                            label="Saving..."
                            showLabel
                        />
                    ) : (
                        "Save changes"
                    )}
                </Button>
            </form>
        </section>
    );
}
