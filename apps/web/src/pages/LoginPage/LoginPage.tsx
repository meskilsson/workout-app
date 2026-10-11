import { reportFormError, friendlyError } from "../../utils/formValidation";
import ValidatedForm from "../../components/forms/ValidatedForm";
import { motion } from "motion/react";
import { useFieldMotion } from "../../components/motion/useFieldMotion";
import { useReducedMotion } from "../../components/motion/useReducedMotion";
import Icon from "../../components/ui/icon/Icon";

import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import type { FormEvent } from "react";
import { useNavigate } from "../../routes/navigationHooks";

import { useAuth } from "../../context/AuthContext";
import { loginRequest } from "../../services/authApi";

import Box from "../../components/ui/box/Box";
import Button from "../../components/ui/button/Button";
import styles from "../../components/forms/AuthPage.module.css";

const authRest = { backgroundColor: "var(--auth-input)", borderColor: "transparent", borderBottomColor: "var(--color-input-border)", boxShadow: "none" };
const authFocus = { ...authRest, borderBottomColor: "var(--color-focus)" };

export default function LoginPage() {
    const fieldMotion = useFieldMotion(0.18);
    const reducedMotion = useReducedMotion();
    const navigate = useNavigate();
    const { login } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const loginMutation = useMutation({ mutationFn: loginRequest });
    const isLoading = loginMutation.isPending;

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const submittedForm = e.currentTarget;
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
            if (!reportFormError(submittedForm, err)) setError(friendlyError(err, "Unable to log in. Please try again."));
        }
    }

    return (
        <Box className={styles.page}>
            <div className={styles.authWrap} aria-busy={isLoading}>
                <div className={styles.topText}>

                    <h1>Log in</h1>
                </div>

                    <ValidatedForm className={styles.form} onSubmit={handleSubmit}>
                        <div className={styles.field}>
                            <label htmlFor="email">Email</label>

                            <motion.input {...fieldMotion("email", authRest, authFocus)}
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email" autoCapitalize="none" spellCheck={false}
                                required
                            />
                        </div>

                        <div className={styles.field}>
                            <label htmlFor="password">Password</label>

                            <motion.input {...fieldMotion("password", authRest, authFocus)}
                                id="password"
                                type="password"
                                placeholder="Your password"
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

                        <Button className={`${styles.submit} ${styles.loginButton}`} type="submit" disabled={isLoading} aria-busy={isLoading}>
                {isLoading && !reducedMotion && <span className={styles.loginWaveClip} aria-hidden="true">
                    <motion.span className={styles.loginWave}
                        initial={{ x: "0%" }} animate={{ x: "280%" }}
                        transition={{ duration: 1.15, ease: "easeInOut", repeat: Infinity, repeatDelay: 0.2 }} />
                </span>}
                            <span className={styles.submitLabel}>
                            {isLoading ? <span role="status">Logging in...</span> : "Log in"}
                            </span><span className={styles.submitArrow}><Icon icon={ArrowRight} /></span>
                        </Button>
                    </ValidatedForm>

                <p className={styles.bottomText}>
                    No account?{" "}
                    <button type="button" onClick={() => navigate("/signup")}>
                        Register
                    </button>
                </p>
            </div>
        </Box>
    );
}
