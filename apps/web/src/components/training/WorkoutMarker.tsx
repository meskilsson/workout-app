import { PersonStanding, Link2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import Icon from "../ui/icon/Icon";
import styles from "./WorkoutMarker.module.css";

export default function WorkoutMarker({ kind }: { kind: "warmup" | "superset" }) {
    const { t } = useTranslation();
    return <span className={`${styles.marker} ${kind === "warmup" ? styles.warmup : ""}`}>
        <Icon icon={kind === "warmup" ? PersonStanding : Link2} />{t(`workout.${kind}`)}
    </span>;
}
