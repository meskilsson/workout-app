import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { loginRequest } from "../../services/authApi";

import Box from "../../components/ui/box/Box";
import Button from "../../components/ui/button/Button";
import Card from "../../components/ui/cards/Card";

import styles from "./LoginPage.module.css";

export default function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const user = await loginRequest({
                email,
                password,
            });

            login(user);
            navigate("/homepage");
        } catch (err) {
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
            <section className={styles.authShell}>
                <div className={styles.intro}>
                    <p className={styles.eyebrow}>Welcome back</p>

                    <h1 className={styles.title}>
                        Log in and start building your next workout.
                    </h1>

                    <p className={styles.subtitle}>
                        Save templates, manage exercises, and keep your training organized.
                    </p>
                </div>

                <Card className={styles.loginCard}>
                    <div className={styles.cardHeader}>
                        <h2>Login</h2>
                        <p>Enter your details to continue.</p>
                    </div>

                    <form className={styles.form} onSubmit={handleSubmit}>
                        <div className={styles.field}>
                            <label htmlFor="email">Email</label>

                            <input
                                id="email"
                                type="email"
                                placeholder="123@example.com"
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

                        <div className={styles.submitRow}>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? "Logging in..." : "Login"}
                            </Button>
                        </div>

                        <p className={styles.signupText}>
                            Don&apos;t have an account?{" "}
                            <button
                                type="button"
                                className={styles.textButton}
                                onClick={() => navigate("/signup")}
                            >
                                Sign up
                            </button>
                        </p>
                    </form>
                </Card>
            </section>
        </Box>
    );
}