import type { HTMLAttributes, ReactNode } from "react";


type CardProps = HTMLAttributes<HTMLDivElement> & {
    title?: string;
    className?: string;
    children?: ReactNode;
    variant?: "primary" | "secondary";
}

export default function Card({ title, className, children, variant = "primary", ...rest }: CardProps) {
    return (
        <div className={`card card--${variant} ${className}`} {...rest}>
            {title && <h2>{title}</h2>}
            {children}
        </div>
    );
}