import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import Icon from "../../components/ui/icon/Icon";
import styles from "./SetOptions.module.css";

export default function SetOptions({ label, disabled, canDelete, onDelete }: {
    label: string; disabled: boolean; canDelete: boolean; onDelete: () => void;
}) {
    const { t } = useTranslation();
    const id = useId();
    const trigger = useRef<HTMLButtonElement>(null);
    const menu = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
    const open = !!position && !disabled;
    function close(restoreFocus = false) {
        setPosition(null);
        if (restoreFocus) trigger.current?.focus({ preventScroll: true });
    }
    function show() {
        const rect = trigger.current?.getBoundingClientRect();
        if (!rect || disabled) return;
        const viewport = window.visualViewport;
        const bottom = (viewport?.offsetTop ?? 0) + (viewport?.height ?? window.innerHeight);
        const left = viewport?.offsetLeft ?? 0;
        setPosition({ top: rect.bottom + 64 > bottom ? Math.max(viewport?.offsetTop ?? 0, rect.top - 60) : rect.bottom + 6,
            left: Math.max(left + 8, Math.min(rect.right - 176, left + (viewport?.width ?? window.innerWidth) - 184)) });
    }
    useEffect(() => {
        if (!open) return;
        (menu.current?.querySelector<HTMLButtonElement>('button:not(:disabled)') ?? menu.current)?.focus({ preventScroll: true });
        const outside = (event: PointerEvent) => {
            if (!menu.current?.contains(event.target as Node) && !trigger.current?.contains(event.target as Node)) setPosition(null);
        };
        const hide = () => setPosition(null);
        document.addEventListener("pointerdown", outside);
        window.addEventListener("scroll", hide, true);
        window.addEventListener("resize", hide);
        window.visualViewport?.addEventListener("resize", hide);
        return () => {
            document.removeEventListener("pointerdown", outside);
            window.removeEventListener("scroll", hide, true);
            window.removeEventListener("resize", hide);
            window.visualViewport?.removeEventListener("resize", hide);
        };
    }, [open]);
    return <>
        <button ref={trigger} type="button" className={styles.trigger} disabled={disabled} aria-label={label}
            aria-haspopup="menu" aria-expanded={open} aria-controls={open ? id : undefined}
            onClick={() => open ? close() : show()}
            onKeyDown={event => { if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); show(); } }}>
            <Icon icon={MoreHorizontal} />
        </button>
        {open && createPortal(<div ref={menu} id={id} role="menu" aria-label={label} tabIndex={-1}
            className={styles.menu} style={position!}
            onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) close(); }}
            onKeyDown={event => {
                if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(true); }
                if (event.key === "Tab") close(true);
                if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
                    event.preventDefault(); menu.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();
                }
            }}>
            <button type="button" role="menuitem" disabled={!canDelete} onClick={() => {
                const row = trigger.current?.closest('[data-completed]')?.parentElement;
                const next = row?.nextElementSibling?.querySelector<HTMLButtonElement>('button')
                    ?? row?.previousElementSibling?.querySelector<HTMLButtonElement>('button');
                close(); onDelete(); next?.focus({ preventScroll: true });
            }}><Icon icon={Trash2} />{t("workout.deleteSet")}</button>
        </div>, document.body)}
    </>;
}
