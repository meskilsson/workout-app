import type { ReactNode, ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    title?: string;
    children?: ReactNode;
    variant?: "primary" | "secondary";
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
        <button className={`${className} ${size} ${variant}`} {...rest}>
            {children ?? title}
        </button>
    );
}