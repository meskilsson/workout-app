import { useTranslation } from "react-i18next";
import { t } from "../../../i18n";
import { AnimatePresence, motion, useIsPresent, type HTMLMotionProps } from "motion/react";
import { useMotionTransition } from "../../motion/useMotionTransition";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import Box from "../box/Box";
import "./modal.css";

type ModalProps = {
    title?: string;
    isOpen: boolean;
    onClose: () => void;
    children?: ReactNode;
    actions?: ReactNode;
};

function DialogOverlay(props: HTMLMotionProps<"div">) {
    useTranslation();
    const present = useIsPresent();
    return <motion.div {...props} inert={!present} aria-hidden={!present || undefined} />;
}

export default function Modal({
    title,
    isOpen,
    onClose,
    children,
    actions,
}: ModalProps) {
    useTranslation();
    const transition = useMotionTransition(0.15);
    const titleId = useId();
    const panelRef = useRef<HTMLDivElement>(null);
    const closeRef = useRef(onClose);
    useEffect(() => { closeRef.current = onClose; }, [onClose]);
    useEffect(() => {
        if (!isOpen) return;
        const previousFocus = document.activeElement as HTMLElement | null;
        const panel = panelRef.current;
        if (!panel) return;
        const scrollY = window.scrollY;
        const previousStyle = { position: document.body.style.position, top: document.body.style.top,
            width: document.body.style.width, overflow: document.body.style.overflow };
        document.body.style.position = "fixed";
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = "100%";
        document.body.style.overflow = "hidden";
        const controls = () => Array.from(panel.querySelectorAll<HTMLElement>(
            'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]',
        )).filter(element => element.getClientRects().length > 0);
        (controls()[0] ?? panel).focus();
        function handleKey(event: KeyboardEvent) {
            if (event.key === "Escape") { event.preventDefault(); closeRef.current(); }
            if (event.key !== "Tab") return;
            const items = controls();
            if (!items.length) { event.preventDefault(); panel?.focus(); return; }
            const first = items[0], last = items[items.length - 1];
            if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
                event.preventDefault(); last.focus();
            } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === panel)) {
                event.preventDefault(); first.focus();
            }
        }
        function containFocus(event: FocusEvent) {
            if (!panel?.contains(event.target as Node)) (controls()[0] ?? panel)?.focus();
        }
        document.addEventListener("keydown", handleKey);
        document.addEventListener("focusin", containFocus);
        return () => {
            document.removeEventListener("keydown", handleKey);
            document.removeEventListener("focusin", containFocus);
            Object.assign(document.body.style, previousStyle);
            window.scrollTo({ top: scrollY, behavior: "instant" });
            if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
        };
    }, [isOpen]);

    return createPortal(
        <AnimatePresence>
        {isOpen && <DialogOverlay key="dialog" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={transition} className="modal-overlay" onClick={onClose}>
            <motion.div initial={{ scale: transition.duration === 0 ? 1 : 0.98 }} animate={{ scale: 1 }} exit={{ scale: transition.duration === 0 ? 1 : 0.98 }} transition={transition}
                className="modal-shell"
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? titleId : undefined}
                aria-label={title ? undefined : t("Modal.workoutDialog")}
                tabIndex={-1}
                onClick={(event) => event.stopPropagation()}
            >
                <Box className="modal-panel">
                    <div className="modal-header">
                        {title && <h2 id={titleId} className="modal-title">{title}</h2>}
                        <button type="button" className="modal-close" aria-label={t("Modal.closeDialog")} onClick={onClose}><X aria-hidden="true" size={20} /></button>
                    </div>

                    <div className="modal-content">{children}</div>

                    {actions && <div className="modal-actions">{actions}</div>}
                </Box>
            </motion.div>
        </DialogOverlay>}
        </AnimatePresence>, document.body,
    );
}
