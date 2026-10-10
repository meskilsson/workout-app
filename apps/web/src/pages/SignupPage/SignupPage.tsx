import { UserPlus } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useLayoutEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "../../routes/navigationHooks";

import Card from "../../components/ui/cards/Card";
import Box from "../../components/ui/box/Box";
import Button from "../../components/ui/button/Button";
import LoadingPredator from "../../components/Loading/LoadingPredator";

import { signupRequest } from "../../services/authApi";
import { ApiRequestError } from "../../utils/parseJsonResponse";
import { focusInvalidField } from "../../utils/focusInvalidField";

import styles from "./SignupPage.module.css";

type SignupFieldErrors = {
    name?: string;
    email?: string;
    username?: string;
    password?: string;
};

function getSignupFieldErrors(errorData: unknown): SignupFieldErrors {
    if (
        typeof errorData !== "object" ||
        errorData === null ||
        !("errors" in errorData) ||
        !Array.isArray(errorData.errors)
    ) {
        return {};
    }

    const nextErrors: SignupFieldErrors = {};

    for (const error of errorData.errors) {
        if (
            typeof error === "object" &&
            error !== null &&
            "field" in error &&
            "message" in error
        ) {
            const field = String(error.field);
            const message = String(error.message);

            if (
                field === "name" ||
                field === "email" ||
                field === "username" ||
                field === "password"
            ) {
                nextErrors[field] = message;
            }
        }
    }

    return nextErrors;
}

export default function SignupPage() {
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [error, setError] = useState("");
    const signupMutation = useMutation({ mutationFn: signupRequest });
    const isLoading = signupMutation.isPending;
    const [fieldErrors, setFieldErrors] = useState<SignupFieldErrors>({});
    const formRef = useRef<HTMLFormElement>(null);
    const focusPending = useRef(false);
    useLayoutEffect(() => {
        if (!focusPending.current || !formRef.current) return;
        focusPending.current = false;
        focusInvalidField(formRef.current);
    }, [fieldErrors]);

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (isLoading) return;

        setError("");
        setFieldErrors({});

        try {
            await signupMutation.mutateAsync({
                name,
                email,
                username,
                password,
            });

            navigate("/login");
        } catch (err) {
            if (err instanceof ApiRequestError) {
                const nextFieldErrors = getSignupFieldErrors(err.data);

                focusPending.current = true;
                setFieldErrors(nextFieldErrors);

                if (Object.keys(nextFieldErrors).length === 0) {
                    setError(err.message);
                }

                return;
            }

            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Unable to complete this request. Please try again.");
            }
        }
    }

    return (
        <Box className={styles.page}>
            <div className={styles.authWrap}>
                <div className={styles.topText}>
                    <p className={styles.brand}>Workout App</p>
                    <h1>Create account</h1>
                    <p>Save your routines and track each session.</p>
                </div>

                <Card className={styles.card}>
                    <form ref={formRef} className={styles.form} onSubmit={handleSubmit}>
                        <div className={styles.field}>
                            <label htmlFor="name">Name</label>

                            <input
                                id="name"
                                aria-invalid={Boolean(fieldErrors.name)}
                                aria-describedby={fieldErrors.name ? "name-error" : undefined}
                                type="text"
                                placeholder="Your name"
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value);
                                    setFieldErrors((prev) => ({
                                        ...prev,
                                        name: undefined,
                                    }));
                                }}
                                className={fieldErrors.name ? styles.inputError : ""}
                                autoComplete="name"
                                required
                            />

                            {fieldErrors.name && (
                                <p id="name-error" className={styles.fieldError} role="alert">
                                    {fieldErrors.name}
                                </p>
                            )}
                        </div>

                        <div className={styles.field}>
                            <label htmlFor="email">Email</label>

                            <input
                                id="email"
                                aria-invalid={Boolean(fieldErrors.email)}
                                aria-describedby={fieldErrors.email ? "email-error" : undefined}
                                type="email"
                                placeholder="example@example.com"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    setFieldErrors((prev) => ({
                                        ...prev,
                                        email: undefined,
                                    }));
                                }}
                                className={fieldErrors.email ? styles.inputError : ""}
                                autoComplete="email"
                                required
                            />

                            {fieldErrors.email && (
                                <p id="email-error" className={styles.fieldError} role="alert">
                                    {fieldErrors.email}
                                </p>
                            )}
                        </div>

                        <div className={styles.field}>
                            <label htmlFor="username">Username</label>

                            <input
                                id="username"
                                aria-invalid={Boolean(fieldErrors.username)}
                                aria-describedby={fieldErrors.username ? "username-error" : undefined}
                                type="text"
                                placeholder="JaneDoe"
                                value={username}
                                onChange={(e) => {
                                    setUsername(e.target.value);
                                    setFieldErrors((prev) => ({
                                        ...prev,
                                        username: undefined,
                                    }));
                                }}
                                className={
                                    fieldErrors.username ? styles.inputError : ""
                                }
                                autoComplete="username"
                                required
                            />

                            {fieldErrors.username && (
                                <p id="username-error" className={styles.fieldError} role="alert">
                                    {fieldErrors.username}
                                </p>
                            )}
                        </div>

                        <div className={styles.field}>
                            <label htmlFor="password">Password</label>

                            <input
                                id="password"
                                aria-invalid={Boolean(fieldErrors.password)}
                                aria-describedby={fieldErrors.password ? "password-error" : undefined}
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setFieldErrors((prev) => ({
                                        ...prev,
                                        password: undefined,
                                    }));
                                }}
                                className={
                                    fieldErrors.password ? styles.inputError : ""
                                }
                                autoComplete="new-password"
                                required
                            />

                            {fieldErrors.password && (
                                <p id="password-error" className={styles.fieldError} role="alert">
                                    {fieldErrors.password}
                                </p>
                            )}
                        </div>

                        {error && (
                            <p className={styles.error} role="alert">
                                {error}
                            </p>
                        )}

                        <Button icon={UserPlus} type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <LoadingPredator
                                    size="small"
                                    color="currentColor"
                                    label="Creating account..."
                                    showLabel
                                />
                            ) : (
                                "Create account"
                            )}
                        </Button>
                    </form>
                </Card>

                <p className={styles.bottomText}>
                    Already have an account?{" "}
                    <button type="button" onClick={() => navigate("/login")}>
                        Log in
                    </button>
                </p>
            </div>
        </Box>
    );
}
