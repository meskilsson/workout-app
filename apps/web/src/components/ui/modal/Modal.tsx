import { useEffect, useId, useRef, type ReactNode } from "react";
import Box from "../box/Box";
import "./modal.css";

type ModalProps = {
    title?: string;
    isOpen: boolean;
    onClose: () => void;
    children?: ReactNode;
    actions?: ReactNode;
};

export default function Modal({
    title,
    isOpen,
    onClose,
    children,
    actions,
}: ModalProps) {
    const titleId = useId();
    const panelRef = useRef<HTMLDivElement>(null);
    const closeRef = useRef(onClose);
    useEffect(() => { closeRef.current = onClose; }, [onClose]);
    useEffect(() => {
        if (!isOpen) return;
        const previousFocus = document.activeElement as HTMLElement | null;
        const panel = panelRef.current;
        if (!panel) return;
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
            if (previousFocus?.isConnected) previousFocus.focus();
        };
    }, [isOpen]);
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-shell"
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? titleId : undefined}
                aria-label={title ? undefined : "Workout dialog"}
                tabIndex={-1}
                onClick={(event) => event.stopPropagation()}
            >
                <Box className="modal-panel">
                    {title && <h2 id={titleId} className="modal-title">{title}</h2>}

                    <div className="modal-content">{children}</div>

                    {actions && <div className="modal-actions">{actions}</div>}
                </Box>
            </div>
        </div>
    );
}
