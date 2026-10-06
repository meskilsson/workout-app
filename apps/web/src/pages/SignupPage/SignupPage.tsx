import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import Card from "../../components/ui/cards/Card";
import Box from "../../components/ui/box/Box";
import Button from "../../components/ui/button/Button";
import LoadingPredator from "../../components/Loading/LoadingPredator";

import { signupRequest } from "../../services/authApi";
import { ApiRequestError } from "../../utils/parseJsonResponse";

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
    const [isLoading, setIsLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<SignupFieldErrors>({});

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();

        setError("");
        setFieldErrors({});
        setIsLoading(true);

        try {
            await signupRequest({
                name,
                email,
                username,
                password,
            });

            navigate("/login");
        } catch (err) {
            if (err instanceof ApiRequestError) {
                const nextFieldErrors = getSignupFieldErrors(err.data);

                setFieldErrors(nextFieldErrors);

                if (Object.keys(nextFieldErrors).length === 0) {
                    setError(err.message);
                }

                return;
            }

            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Something went wrong");
            }
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Box className={styles.page}>
            <div className={styles.authWrap}>
                <div className={styles.topText}>
                    <p className={styles.brand}>Workout App</p>
                    <h1>Create account</h1>
                    <p>Set up your account and start saving workouts.</p>
                </div>

                <Card className={styles.card}>
                    <form className={styles.form} onSubmit={handleSubmit}>
                        <div className={styles.field}>
                            <label htmlFor="name">Name</label>

                            <input
                                id="name"
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
                                <p className={styles.fieldError}>
                                    {fieldErrors.name}
                                </p>
                            )}
                        </div>

                        <div className={styles.field}>
                            <label htmlFor="email">Email</label>

                            <input
                                id="email"
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
                                <p className={styles.fieldError}>
                                    {fieldErrors.email}
                                </p>
                            )}
                        </div>

                        <div className={styles.field}>
                            <label htmlFor="username">Username</label>

                            <input
                                id="username"
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
                                <p className={styles.fieldError}>
                                    {fieldErrors.username}
                                </p>
                            )}
                        </div>

                        <div className={styles.field}>
                            <label htmlFor="password">Password</label>

                            <input
                                id="password"
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
                                <p className={styles.fieldError}>
                                    {fieldErrors.password}
                                </p>
                            )}
                        </div>

                        {error && (
                            <p className={styles.error} role="alert">
                                {error}
                            </p>
                        )}

                        <Button type="submit" disabled={isLoading}>
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