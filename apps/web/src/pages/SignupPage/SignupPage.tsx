import { motion } from "motion/react";
import { useFieldMotion } from "../../components/motion/useFieldMotion";
import Icon from "../../components/ui/icon/Icon";

import { ArrowRight } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useLayoutEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "../../routes/navigationHooks";

import Box from "../../components/ui/box/Box";
import Button from "../../components/ui/button/Button";
import LoadingPredator from "../../components/Loading/LoadingPredator";

import { signupRequest } from "../../services/authApi";
import { ApiRequestError } from "../../utils/parseJsonResponse";
import { focusInvalidField } from "../../utils/focusInvalidField";

import styles from "../../components/forms/AuthPage.module.css";

const authRest = { backgroundColor: "var(--auth-input)", borderColor: "transparent", borderBottomColor: "var(--color-input-border)", boxShadow: "none" };
const authFocus = { ...authRest, borderBottomColor: "var(--color-focus)" };

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
    const fieldMotion = useFieldMotion(0.18);
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
                    <h1>Register</h1>
                </div>

                    <form ref={formRef} className={styles.form} onSubmit={handleSubmit}>
                        <div className={styles.field}>
                            <label htmlFor="name">Name</label>

                            <motion.input {...fieldMotion("name", authRest, authFocus)}
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

                            <motion.input {...fieldMotion("email", authRest, authFocus)}
                                id="email"
                                aria-invalid={Boolean(fieldErrors.email)}
                                aria-describedby={fieldErrors.email ? "email-error" : undefined}
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    setFieldErrors((prev) => ({
                                        ...prev,
                                        email: undefined,
                                    }));
                                }}
                                className={fieldErrors.email ? styles.inputError : ""}
                                autoComplete="email" autoCapitalize="none" spellCheck={false}
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

                            <motion.input {...fieldMotion("username", authRest, authFocus)}
                                id="username"
                                aria-invalid={Boolean(fieldErrors.username)}
                                aria-describedby={fieldErrors.username ? "username-error" : undefined}
                                type="text"
                                placeholder="Choose a username"
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
                                autoComplete="username" autoCapitalize="none" spellCheck={false}
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

                            <motion.input {...fieldMotion("password", authRest, authFocus)}
                                id="password"
                                aria-invalid={Boolean(fieldErrors.password)}
                                aria-describedby={fieldErrors.password ? "password-error" : undefined}
                                type="password"
                                placeholder="Choose a password"
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

                        <Button className={styles.submit} type="submit" disabled={isLoading}>
                            <span className={styles.submitLabel}>
                            {isLoading ? (
                                <LoadingPredator
                                    size="small"
                                    color="currentColor"
                                    label="Creating account..."
                                    showLabel
                                />
                            ) : (
                                "Register"
                            )}
                            </span><span className={styles.submitArrow}><Icon icon={ArrowRight} /></span>
                        </Button>
                    </form>

                <p className={styles.bottomText}>
                    Already registered?{" "}
                    <button type="button" onClick={() => navigate("/login")}>
                        Log in
                    </button>
                </p>
            </div>
        </Box>
    );
}
