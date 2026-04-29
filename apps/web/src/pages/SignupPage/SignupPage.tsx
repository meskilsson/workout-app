import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import Card from "../../components/ui/cards/Card";
import Box from "../../components/ui/box/Box";
import Button from "../../components/ui/button/Button";

import { signupRequest } from "../../services/authApi";

import styles from "./SignupPage.module.css";

export default function SignupPage() {
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");
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
                    <p className={styles.eyebrow}>Start training</p>

                    <h1 className={styles.title}>
                        Create your account and build better workouts.
                    </h1>

                    <p className={styles.subtitle}>
                        Save your exercises, build workout templates, and keep your
                        training organized from one place.
                    </p>
                </div>

                <Card className={styles.signupCard}>
                    <div className={styles.cardHeader}>
                        <h2>Sign up</h2>
                        <p>Create an account to get started.</p>
                    </div>

                    <form className={styles.form} onSubmit={handleSubmit}>
                        <div className={styles.field}>
                            <label htmlFor="name">Name</label>

                            <input
                                id="name"
                                type="text"
                                placeholder="Your name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                autoComplete="name"
                                required
                            />
                        </div>

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
                            <label htmlFor="username">Username</label>

                            <input
                                id="username"
                                type="text"
                                placeholder="Jane Doe"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                autoComplete="username"
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
                                autoComplete="new-password"
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
                                {isLoading ? "Creating account..." : "Sign up"}
                            </Button>
                        </div>

                        <p className={styles.loginText}>
                            Already have an account?{" "}
                            <button
                                type="button"
                                className={styles.textButton}
                                onClick={() => navigate("/login")}
                            >
                                Login
                            </button>
                        </p>
                    </form>
                </Card>
            </section>
        </Box>
    );
}