import type { HTMLAttributes, ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
    title?: string;
    className?: string;
    children?: ReactNode;
    variant?: "default" | "primary" | "timer" | "image";
};

export default function Card({
    title,
    className = "",
    children,
    variant = "default",
    ...rest
}: CardProps) {
    return (
        <div className={`card card--${variant} ${className}`.trim()} {...rest}>
            {title && <h2 className="card__title">{title}</h2>}
            {children}
        </div>
    );
}