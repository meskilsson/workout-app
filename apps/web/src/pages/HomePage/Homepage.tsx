import { useTranslation } from "react-i18next";
import { t } from "../../i18n";
import { motion } from "motion/react";
import { useMotionTransition } from "../../components/motion/useMotionTransition";
import { useNavigate } from "../../routes/navigationHooks";
import { ArrowRight, BookOpen, Dumbbell, History, Plus } from "lucide-react";
import { useCurrentWorkout } from "@workout-app/shared/currentWorkoutContext";
import { useWorkoutTimer, formatElapsedMilliseconds } from "@workout-app/shared/timer";
import Button from "../../components/ui/button/Button";
import Icon from "../../components/ui/icon/Icon";
import { useAuth } from "../../context/AuthContext";
import styles from "./Homepage.module.css";

export default function Homepage() {
    useTranslation();
    const transition = useMotionTransition(0.15);
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const { currentWorkoutId } = useCurrentWorkout();
    const { state } = useWorkoutTimer();
    const destinations = [
        { title: t("common.workoutTemplates"), description: t("Homepage.chooseARoutineOrManageYourOwn"), icon: Dumbbell, path: "/templates" },
        { title: t("common.exerciseLibrary"), description: t("Homepage.findMovementsAndTheMusclesTheyTarget"), icon: BookOpen, path: "/library" },
        ...(isAuthenticated ? [{ title: t("common.workoutHistory"), description: t("Homepage.reviewCompletedSessionsOrTrainThemAgain"), icon: History, path: "/profile/workouts" }] : []),
    ];
    return (
        <div className={styles.page}>
            <header className={styles.intro}>
                <h1 className={styles.title}>{user?.name ? t("Homepage.welcomeBackValue", { value0: user.name }) : t("Homepage.yourTrainingInOnePlace")}</h1>
                <p className={styles.subtitle}>{t("Homepage.planYourWorkoutLogYourSetsKeepMovingForward")}</p>
            </header>
            <section className={styles.sessionSection} aria-label={t("Homepage.startOrResumeTraining")}>
                {isAuthenticated && currentWorkoutId && <div className={styles.activeSession}>
                    <div><p className={styles.kicker}>{t("Homepage.activeSession")}</p><h2>{t("Homepage.yourWorkoutIsReadyToContinue")}</h2>
                        <p className={styles.sessionTime}>{formatElapsedMilliseconds(state.elapsedTime)} <span>{state.isRunning ? t("common.elapsed") : t("common.paused")}</span></p>
                    </div>
                    <Button variant="secondary" className={styles.resumeButton} onClick={() => navigate(`/workout/${currentWorkoutId}`)} icon={ArrowRight}>{t("common.resumeWorkout")}</Button>
                </div>}
                <div className={styles.newSession}>
                    <div><h2>{t("Homepage.startAWorkout")}</h2><p>{t("Homepage.chooseYourExercisesAndBuildASession")}</p></div>
                    <Button variant="secondary" onClick={() => navigate("/workout-select")} icon={Plus}>{t("Homepage.newWorkout")}</Button>
                </div>
            </section>
            <section className={styles.section} aria-labelledby="training-heading">
                <h2 id="training-heading">{t("Homepage.yourTraining")}</h2>
                <div className={styles.destinations}>
                    {destinations.map(item => <motion.button initial={false} animate={{ backgroundColor: "transparent" }} whileHover={{ backgroundColor: "var(--color-primary-soft)" }} transition={transition} key={item.path} type="button" className={styles.destination} onClick={() => navigate(item.path)}>
                        <Icon icon={item.icon} /><span><strong>{item.title}</strong><span>{item.description}</span></span><Icon icon={ArrowRight} />
                    </motion.button>)}
                </div>
            </section>
        </div>
    );
}
