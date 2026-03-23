import type { ReactNode } from "react";
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
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <Box className="modal-panel">
                {title && <h2 className="modal-title">{title}</h2>}
                <div className="modal-content">{children}</div>
                <div className="modal-actions">{actions}</div>
            </Box>
        </div>
    );
}