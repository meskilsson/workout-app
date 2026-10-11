import { useEffect, useRef, useState, useId } from "react";
import { useTranslation } from "react-i18next";
import { Languages, Check } from "lucide-react";
import { LayoutGroup, motion, useAnimationControls } from "motion/react";
import { useReducedMotion } from "../motion/useReducedMotion";
import { changeLanguage, type Language } from "../../i18n";
import Icon from "../ui/icon/Icon";
import styles from "./LanguageSelect.module.css";

const languages = [{ value: "en", label: "English" }, { value: "sv", label: "Svenska" }] as const;
export default function LanguageSelect() {
    const { t, i18n } = useTranslation();
    const [open, setOpen] = useState(false);
    const root = useRef<HTMLDivElement>(null);
    const trigger = useRef<HTMLButtonElement>(null);
    const options = useRef<(HTMLButtonElement | null)[]>([]);
    const id = useId();
    const reducedMotion = useReducedMotion();
    const iconAnimation = useAnimationControls();
    const previousLanguage = useRef(i18n.resolvedLanguage);
    useEffect(() => {
        if (previousLanguage.current !== i18n.resolvedLanguage && !reducedMotion) {
            void iconAnimation.start({ rotateX: [0, 180, 360], transition: { duration: 0.42, ease: "easeInOut" } });
        } else iconAnimation.set({ rotateX: 0 });
        previousLanguage.current = i18n.resolvedLanguage;
        return () => iconAnimation.stop();
    }, [i18n.resolvedLanguage, reducedMotion, iconAnimation]);
    const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    useEffect(() => () => clearTimeout(closeTimer.current), [open]);
    const selected = i18n.resolvedLanguage === "sv" ? 1 : 0;
    useEffect(() => {
        if (!open) return;
        options.current[selected]?.focus();
        const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
        document.addEventListener("pointerdown", outside);
        return () => document.removeEventListener("pointerdown", outside);
    }, [open, selected]);
    function close() { clearTimeout(closeTimer.current); setOpen(false); trigger.current?.focus(); }
    function select(language: Language) {
        clearTimeout(closeTimer.current);
        if (language === i18n.resolvedLanguage) { close(); return; }
        void changeLanguage(language);
        if (reducedMotion) close();
        else closeTimer.current = setTimeout(close, 180);
    }
    return <div ref={root} className={styles.root} onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
    }} onKeyDown={event => {
        if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(); }
        if (open && ["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
            event.preventDefault();
            const current = options.current.findIndex(option => option === document.activeElement);
            const next = event.key === "Home" ? 0 : event.key === "End" ? 1 : (current + (event.key === "ArrowDown" ? 1 : -1) + 2) % 2;
            options.current[next]?.focus();
        }
    }}>
        <button type="button" className={styles.trigger} ref={trigger} aria-label={t("language.choose")}
            title={t("language.choose")} aria-haspopup="menu" aria-expanded={open} aria-controls={open ? id : undefined}
            onClick={() => setOpen(value => !value)} onKeyDown={event => {
                if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); setOpen(true); }
            }}><motion.span initial={false} animate={iconAnimation} style={{ display: "inline-flex", transformPerspective: 500 }}><Icon icon={Languages} /></motion.span></button>
        {open && <LayoutGroup id={id}><div id={id} role="menu" aria-label={t("language.choose")} className={styles.menu}>
            {languages.map((language, index) => <button key={language.value} type="button" role="menuitemradio" tabIndex={-1}
                aria-checked={index === selected} lang={language.value} ref={element => { options.current[index] = element; }}
                onClick={() => select(language.value)}>{language.label}{index === selected && <motion.span layoutId="language-check" initial={false}
                    transition={{ duration: reducedMotion ? 0 : 0.16, ease: "easeInOut" }} style={{ display: "inline-flex" }}><Icon icon={Check} /></motion.span>}</button>)}
        </div></LayoutGroup>}
    </div>;
}
