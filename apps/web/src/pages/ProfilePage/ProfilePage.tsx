import { useTranslation } from "react-i18next";
import { t } from "../../i18n";
import { ArrowLeft } from "lucide-react";
import Icon from "../../components/ui/icon/Icon";
import Card from "../../components/ui/cards/Card";
import { useAuth } from "../../context/AuthContext";
import styles from "./ProfilePage.module.css";
import Button from "../../components/ui/button/Button";
import { useNavigate } from "../../routes/navigationHooks";


export default function ProfilePage() {
    useTranslation();
    const { user } = useAuth();
    const navigate = useNavigate();

    if (!user) {
        return (
            <div className={styles.page}>
                <Card className={styles.stateCard}>
                    <p className={styles.stateText}>{t("ProfilePage.noUserFound")}</p>
                </Card>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>{t("ProfilePage.yourProfile")}</h1>
                    <p className={styles.subtitle}> {t("ProfilePage.yourAccountDetailsInOnePlace")} </p>

                    <Button
                        type="button"
                        variant="secondary"
                        style={{ minWidth: "3.25rem", marginTop: "1rem" }}
                        iconOnly
                        className={styles.backButton}
                    aria-label={t("common.goBack")}
                        onClick={() => navigate(-1)}

                    >
                        <Icon icon={ArrowLeft} />
                    </Button>
                </div>
            </div>

            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <div>
                        <h3 className={styles.sectionTitle}>{t("ProfilePage.accountInformation")}</h3>
                        <p className={styles.sectionText}> {t("ProfilePage.yourBasicAccountDetails")} </p>
                    </div>
                </div>

                <dl className={styles.infoGrid}>
                    <div className={styles.infoCard}><dt className={styles.infoLabel}>{t("common.name")}</dt><dd className={styles.infoValue}>{user.name}</dd></div>
                    <div className={styles.infoCard}><dt className={styles.infoLabel}>{t("common.username")}</dt><dd className={styles.infoValue}>@{user.username}</dd></div>
                    <div className={styles.infoCard}><dt className={styles.infoLabel}>{t("common.email")}</dt><dd className={styles.infoValue}>{user.email}</dd></div>
                </dl>
            </section>


        </div>
    );
}
