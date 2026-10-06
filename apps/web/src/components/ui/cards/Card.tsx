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
    onClick,
    onKeyDown,
    ...rest
}: CardProps) {
    return (
        <div className={`card card--${variant} ${className}`.trim()}
            role={onClick ? "button" : undefined}
            tabIndex={onClick ? 0 : undefined}
            {...rest}
            onClick={onClick}
            onKeyDown={(event) => {
                onKeyDown?.(event);
                if (onClick && !event.defaultPrevented && event.target === event.currentTarget &&
                    (event.key === "Enter" || event.key === " ") && !rest["aria-disabled"]) {
                    event.preventDefault();
                    event.currentTarget.click();
                }
            }}
        >
            {title && <h2 className="card__title">{title}</h2>}
            {children}
        </div>
    );
}