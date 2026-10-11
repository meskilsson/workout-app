import { displayValue, t } from "../../i18n";
import { useTranslation } from "react-i18next";
import ValidatedForm from "../forms/ValidatedForm";
import { useRef, useState } from "react";
import { Delete } from "lucide-react";
import Button from "../ui/button/Button";
import Icon from "../ui/icon/Icon";
import { parseRestDuration } from "../../utils/restTimerPreference";
import styles from "./RestTimer.module.css";

type Field = "minutes" | "seconds";
export default function RestDurationForm({ duration, disabled, onSave, onCancel }: {
    duration: number; disabled: boolean; onSave: (duration: number) => void; onCancel: () => void;
}) {
    useTranslation();
    const [minutes, setMinutes] = useState(String(Math.floor(duration / 60000)).padStart(2, "0"));
    const [seconds, setSeconds] = useState(String((duration / 1000) % 60).padStart(2, "0"));
    const [active, setActive] = useState<Field>("minutes");
    const replaceNext = useRef(true);
    const durationMs = parseRestDuration(minutes, seconds);
    function update(field: Field, value: string) {
        if (!/^\d*$/.test(value)) return;
        (field === "minutes" ? setMinutes : setSeconds)(value.slice(0, field === "minutes" ? 4 : 2));
    }
    function enter(digit: string) {
        const value = active === "minutes" ? minutes : seconds;
        update(active, replaceNext.current ? digit : value + digit);
        replaceNext.current = false;
    }
    return <ValidatedForm className={styles.durationForm} onSubmit={event => {
        event.preventDefault();
        if (durationMs !== null && !disabled) onSave(durationMs);
    }}>
        <div className={styles.durationFields}>
            {(["minutes", "seconds"] as const).map(field => <label key={field} className={styles.durationField} data-active={active === field}>
                <span>{field === "minutes" ? t("common.minutes") : t("common.seconds")}</span>
                <input type="text" inputMode="none" pattern="[0-9]*" maxLength={field === "minutes" ? 4 : 2}
                    name={field} data-validation-error={field === "minutes" && Number(minutes) > 1440 ? t("RestDurationForm.useNoMoreThan1440Minutes24Hours") : field === "seconds" && Number(seconds) > 59 ? t("RestDurationForm.enterSecondsBetween0And59") : field === "seconds" && durationMs === null && Number(seconds) <= 59 && Number(minutes) <= 1440 ? t("RestDurationForm.chooseADurationBetween1SecondAnd24Hours") : undefined}
                    aria-label={field === "minutes" ? t("common.minutes") : t("common.seconds")} value={field === "minutes" ? minutes : seconds}
                    onFocus={event => { setActive(field); replaceNext.current = true; event.currentTarget.select(); }}
                    onClick={event => { setActive(field); replaceNext.current = true; event.currentTarget.select(); }}
                    onChange={event => { replaceNext.current = false; update(field, event.target.value); }} />
            </label>)}
        </div>
        <div className={styles.keypad} role="group" aria-label={t("RestDurationForm.enterValue", { value0: displayValue(active) })}>
            {[1,2,3,4,5,6,7,8,9].map(digit => <Button key={digit} type="button" variant="secondary" onPointerDown={event => event.preventDefault()} onClick={() => enter(String(digit))}>{digit}</Button>)}
            <span aria-hidden="true" />
            <Button type="button" variant="secondary" onPointerDown={event => event.preventDefault()} onClick={() => enter("0")}>0</Button>
            <Button type="button" variant="ghost" aria-label={t("RestDurationForm.deleteLastValueDigit", { value0: displayValue(active) })} onPointerDown={event => event.preventDefault()} onClick={() => {
                update(active, (active === "minutes" ? minutes : seconds).slice(0, -1)); replaceNext.current = false;
            }}><Icon icon={Delete} /></Button>
        </div>
        <p className={styles.durationHint}>{t("RestDurationForm.tapAFieldThenEnterItsValueSecondsMust")}</p>
        <div className={styles.durationActions}>
            <Button type="button" variant="ghost" onClick={onCancel}>{t("common.cancel")}</Button>
            <Button type="submit" disabled={disabled}>{t("common.save")}</Button>
        </div>
    </ValidatedForm>;
}
