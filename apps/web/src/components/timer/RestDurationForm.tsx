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
    return <form className={styles.durationForm} onSubmit={event => {
        event.preventDefault();
        if (durationMs !== null && !disabled) onSave(durationMs);
    }}>
        <div className={styles.durationFields}>
            {(["minutes", "seconds"] as const).map(field => <label key={field} className={styles.durationField} data-active={active === field}>
                <span>{field === "minutes" ? "Minutes" : "Seconds"}</span>
                <input type="text" inputMode="none" pattern="[0-9]*" maxLength={field === "minutes" ? 4 : 2}
                    aria-label={field === "minutes" ? "Minutes" : "Seconds"} value={field === "minutes" ? minutes : seconds}
                    onFocus={event => { setActive(field); replaceNext.current = true; event.currentTarget.select(); }}
                    onClick={event => { setActive(field); replaceNext.current = true; event.currentTarget.select(); }}
                    onChange={event => { replaceNext.current = false; update(field, event.target.value); }} />
            </label>)}
        </div>
        <div className={styles.keypad} role="group" aria-label={`Enter ${active}`}>
            {[1,2,3,4,5,6,7,8,9].map(digit => <Button key={digit} type="button" variant="secondary" onPointerDown={event => event.preventDefault()} onClick={() => enter(String(digit))}>{digit}</Button>)}
            <span aria-hidden="true" />
            <Button type="button" variant="secondary" onPointerDown={event => event.preventDefault()} onClick={() => enter("0")}>0</Button>
            <Button type="button" variant="ghost" aria-label={`Delete last ${active} digit`} onPointerDown={event => event.preventDefault()} onClick={() => {
                update(active, (active === "minutes" ? minutes : seconds).slice(0, -1)); replaceNext.current = false;
            }}><Icon icon={Delete} /></Button>
        </div>
        <p className={styles.durationHint}>Tap a field, then enter its value. Seconds must be 0-59. Your duration stays saved until you change it.</p>
        <div className={styles.durationActions}>
            <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
            <Button type="submit" disabled={durationMs === null || disabled}>Save</Button>
        </div>
    </form>;
}
