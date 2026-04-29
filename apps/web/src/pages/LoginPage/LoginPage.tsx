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
            navigate("/");
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
            <div className={styles.authWrap}>
                <div className={styles.topText}>
                    <p className={styles.brand}>Workout App</p>

                    <h1>Log in</h1>

                    <p>Continue building and saving your workouts.</p>
                </div>

                <Card className={styles.card}>
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

                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Logging in..." : "Log in"}
                        </Button>
                    </form>
                </Card>

                <p className={styles.bottomText}>
                    Don&apos;t have an account?{" "}
                    <button type="button" onClick={() => navigate("/signup")}>
                        Create one
                    </button>
                </p>
            </div>
        </Box>
    );
}