import { LogIn } from "lucide-react";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import type { FormEvent } from "react";
import { useNavigate } from "../../routes/navigationHooks";

import { useAuth } from "../../context/AuthContext";
import { loginRequest } from "../../services/authApi";

import Box from "../../components/ui/box/Box";
import Button from "../../components/ui/button/Button";
import Card from "../../components/ui/cards/Card";
import LoadingPredator from "../../components/Loading/LoadingPredator";
import styles from "./LoginPage.module.css";

export default function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const loginMutation = useMutation({ mutationFn: loginRequest });
    const isLoading = loginMutation.isPending;

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (isLoading) return;
        setError("");

        try {
            const user = await loginMutation.mutateAsync({
                email,
                password,
            });

            login(user);
            navigate("/");
        } catch (err) {
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

                    <h1>Log in</h1>

                    <p>Log in to plan and track your training.</p>
                </div>

                <Card className={styles.card}>
                    <form className={styles.form} onSubmit={handleSubmit}>
                        <div className={styles.field}>
                            <label htmlFor="email">Email</label>

                            <input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                                required
                            />
                        </div>

                        <div className={styles.field}>
                            <label htmlFor="password">Password</label>

                            <input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                                required
                            />
                        </div>

                        {error && (
                            <p className={styles.error} role="alert">
                                {error}
                            </p>
                        )}

                        <Button icon={LogIn} type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <LoadingPredator
                                    size="small"
                                    color="currentColor"
                                    label="Logging in..."
                                    showLabel
                                />
                            ) : (
                                "Log in"
                            )}
                        </Button>
                    </form>
                </Card>

                <p className={styles.bottomText}>
                    Don&apos;t have an account?{" "}
                    <button type="button" onClick={() => navigate("/signup")}>
                        Create account
                    </button>
                </p>
            </div>
        </Box>
    );
}
