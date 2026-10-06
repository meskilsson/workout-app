import type { LucideIcon } from "lucide-react";
import Icon from "../icon/Icon";
import type { ReactNode, ButtonHTMLAttributes } from "react";
import "./button.css";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    title?: string;
    children?: ReactNode;
    variant?: "primary" | "secondary" | "ghost" | "danger" | "success";
    size?: "small" | "medium" | "large";
    className?: string;
    iconOnly?: boolean;
    icon?: LucideIcon;
    fullWidthMobile?: boolean;
};

export default function Button({
    title,
    children,
    variant = "primary",
    size = "medium",
    className = "",
    iconOnly = false,
    icon,
    fullWidthMobile = false,
    ...rest
}: ButtonProps) {
    const buttonClassName = [
        "button",
        `button--${variant}`,
        `button--${size}`,
        iconOnly ? "button--icon" : "",
        fullWidthMobile ? "button--full-mobile" : "",
        className,
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <button className={buttonClassName} {...rest}>
            {icon && <Icon icon={icon} />}
            {children ?? title}
        </button>
    );
}