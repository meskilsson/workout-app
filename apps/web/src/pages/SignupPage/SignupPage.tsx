import { translateMessage, t } from "../../i18n";
import { useTranslation } from "react-i18next";
import ValidatedForm from "../../components/forms/ValidatedForm";
import { motion } from "motion/react";
import { useFieldMotion } from "../../components/motion/useFieldMotion";
import Icon from "../../components/ui/icon/Icon";

import { ArrowRight } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "../../routes/navigationHooks";

import Box from "../../components/ui/box/Box";
import Button from "../../components/ui/button/Button";
import LoadingPredator from "../../components/Loading/LoadingPredator";

import { signupRequest } from "../../services/authApi";
import { reportFormError, friendlyError } from "../../utils/formValidation";

import styles from "../../components/forms/AuthPage.module.css";

const authRest = { backgroundColor: "var(--auth-input)", borderColor: "transparent", borderBottomColor: "var(--color-input-border)", boxShadow: "none" };
const authFocus = { ...authRest, borderBottomColor: "var(--color-focus)" };

export default function SignupPage() {
    useTranslation();
    const fieldMotion = useFieldMotion(0.18);
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [error, setError] = useState("");
    const signupMutation = useMutation({ mutationFn: signupRequest });
    const isLoading = signupMutation.isPending;
    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const submittedForm = e.currentTarget;
        if (isLoading) return;

        setError("");

        try {
            await signupMutation.mutateAsync({
                name,
                email,
                username,
                password,
            });

            navigate("/login");
        } catch (err) {
            if (!reportFormError(submittedForm, err)) setError(friendlyError(err, t("SignupPage.unableToRegisterPleaseTryAgain")));
        }
    }

    return (
        <Box className={styles.page}>
            <div className={styles.authWrap}>
                <div className={styles.topText}>
                    <h1>{t("common.register")}</h1>
                </div>

                    <ValidatedForm className={styles.form} onSubmit={handleSubmit}>
                        <div className={styles.field}>
                            <label htmlFor="name">{t("common.name")}</label>

                            <motion.input {...fieldMotion("name", authRest, authFocus)}
                                id="name" minLength={2} maxLength={50}
                                type="text"
                                placeholder={t("SignupPage.yourName")}
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value);
                                }}
                                autoComplete="name"
                                required
                            />
                        </div>

                        <div className={styles.field}>
                            <label htmlFor="email">{t("common.email")}</label>

                            <motion.input {...fieldMotion("email", authRest, authFocus)}
                                id="email"
                                type="email"
                                placeholder={t("common.youExampleCom")}
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                }}
                                autoComplete="email" autoCapitalize="none" spellCheck={false}
                                required
                            />
                        </div>

                        <div className={styles.field}>
                            <label htmlFor="username">{t("common.username")}</label>

                            <motion.input {...fieldMotion("username", authRest, authFocus)}
                                id="username" minLength={3} maxLength={20} pattern="[a-zA-Z0-9_]+" data-validation-hint={t("common.useLettersNumbersAndUnderscoresOnly")}
                                type="text"
                                placeholder={t("SignupPage.chooseAUsername")}
                                value={username}
                                onChange={(e) => {
                                    setUsername(e.target.value);
                                }}
                                autoComplete="username" autoCapitalize="none" spellCheck={false}
                                required
                            />
                        </div>

                        <div className={styles.field}>
                            <label htmlFor="password">{t("common.password")}</label>

                            <motion.input {...fieldMotion("password", authRest, authFocus)}
                                id="password" minLength={8} maxLength={100}
                                type="password"
                                placeholder={t("SignupPage.chooseAPassword")}
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                }}
                                autoComplete="new-password"
                                required
                            />
                        </div>

                        {error && (
                            <p className={styles.error} role="alert">
                                {translateMessage(error)}
                            </p>
                        )}

                        <Button className={styles.submit} type="submit" disabled={isLoading}>
                            <span className={styles.submitLabel}>
                            {isLoading ? (
                                <LoadingPredator
                                    size="small"
                                    color="currentColor"
                                    label={t("SignupPage.creatingAccount")}
                                    showLabel
                                />
                            ) : (
                                t("common.register")
                            )}
                            </span><span className={styles.submitArrow}><Icon icon={ArrowRight} /></span>
                        </Button>
                    </ValidatedForm>

                <p className={styles.bottomText}> {t("SignupPage.alreadyRegistered")}{" "}
                    <button type="button" onClick={() => navigate("/login")}> {t("common.logIn")} </button>
                </p>
            </div>
        </Box>
    );
}
