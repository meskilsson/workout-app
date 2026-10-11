import { useTranslation } from "react-i18next";
import { t } from "../../i18n";
import { ArrowRight, ArrowLeft } from "lucide-react";
import Icon from "../../components/ui/icon/Icon";
import { useNavigate } from "../../routes/navigationHooks";

import Card from "../../components/ui/cards/Card";
import Button from "../../components/ui/button/Button";

import styles from "./CreateTemplatePage.module.css";

export default function CreateTemplatePage() {
    useTranslation();
    const navigate = useNavigate();

    return (
        <section className={styles.page}>
            <Card className={styles.card}>
                <Button
                    type="button"
                    variant="secondary"
                    style={{ minWidth: "3.25rem", marginBottom: "1rem" }}
                    iconOnly
                        className={styles.backButton}
                    aria-label={t("common.goBack")}
                    onClick={() => navigate(-1)}

                >
                    <Icon icon={ArrowLeft} />
                </Button>
                <p className={styles.kicker}>{t("common.workoutTemplate")}</p>

                <h1 className={styles.title}>{t("CreateTemplatePage.createATemplate")}</h1>



                <div className={styles.steps}>
                    <div className={styles.step}>
                        <span>1</span>
                        <div>
                            <h2>{t("common.chooseMuscles")}</h2>
                            <p>{t("CreateTemplatePage.selectWhatThisWorkoutShouldTrain")}</p>
                        </div>
                    </div>

                    <div className={styles.step}>
                        <span>2</span>
                        <div>
                            <h2>{t("CreateTemplatePage.pickExercises")}</h2>
                            <p>{t("CreateTemplatePage.chooseYourExercisesAndTheirOrder")}</p>
                        </div>
                    </div>

                    <div className={styles.step}>
                        <span>3</span>
                        <div>
                            <h2>{t("CreateTemplatePage.saveYourTemplate")}</h2>
                            <p>{t("CreateTemplatePage.nameItChooseACategoryAndSaveItFor")}</p>
                        </div>
                    </div>
                </div>

                <div className={styles.actions}>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => navigate("/templates/my")}
                    > {t("common.cancel")} </Button>

                    <Button icon={ArrowRight}
                        type="button"
                        onClick={() => navigate("/workout-select?purpose=template")}
                    > {t("common.chooseMuscles")} </Button>
                </div>
            </Card>
        </section>
    );
}
