import type { ReactNode, ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    title?: string;
    children?: ReactNode;
    variant?: "primary" | "secondary" | "ghost" | "danger" | "success";
    size?: "small" | "medium" | "large";
    className?: string;
};

export default function Button({
    title,
    children,
    variant = "primary",
    size = "medium",
    className = "",
    ...rest
}: ButtonProps) {
    return (
        <button
            className={`button button--${variant} button--${size} ${className}`.trim()}
            {...rest}
        >
            {children ?? title}
        </button>
    );
}