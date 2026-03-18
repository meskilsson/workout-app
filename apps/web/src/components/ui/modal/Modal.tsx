import { ReactNode } from 'react';
import Box from '../box/Box';
import Button from '../button/Button';

type ModalProps = {
    title?: string;
    isOpen: boolean;
    onClose: () => void;
    children?: ReactNode;
}

export default function Modal({ title, isOpen, onClose, children }: ModalProps) {
    if (!isOpen) return null;


    return (
        /* OUTER CONTAINER // BACKGROUND */
        <div>
            <Box>
                {title && <h2>{title}</h2>}
                <div>{children}</div>
                <Button
                    onClick={onClose}
                >Close</Button>
            </Box>
        </div>
    );
}
