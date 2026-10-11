import type { LucideIcon } from "lucide-react";
import Icon from "../icon/Icon";
import type { ReactNode } from "react";
import { motion, type HTMLMotionProps, type TargetAndTransition } from "motion/react";
import { useMotionTransition } from "../../motion/useMotionTransition";
import "./button.css";

type ButtonProps = Omit<HTMLMotionProps<"button">, "animate"> & {
    animate?: TargetAndTransition;
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
    animate,
    whileHover,
    whileTap,
    transition,
    ...rest
}: ButtonProps) {
    const timing = useMotionTransition(0.15);
    const base = variant === "ghost"
        ? { backgroundColor: "transparent", color: "var(--color-text-soft)", borderColor: "transparent" }
        : variant === "secondary"
            ? { backgroundColor: "var(--color-blue-soft)", color: "var(--color-blue-text)", borderColor: "var(--color-blue-border)" }
            : { backgroundColor: `var(--color-${variant})`, color: `var(--color-on-${variant})`, borderColor: variant === "primary" ? "var(--color-primary-border)" : "transparent" };
    const hover = variant === "ghost" ? { color: "var(--color-text)" }
        : variant === "secondary" ? { backgroundColor: "var(--color-blue-hover)", borderColor: "var(--color-blue-border)" }
            : { backgroundColor: `var(--color-${variant}-hover)` };
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
        <motion.button className={buttonClassName} {...rest} initial={false}
            animate={{ ...base, color: `var(--button-color, ${base.color})`, y: 0, opacity: rest.disabled ? 0.7 : 1, ...animate }}
            whileHover={rest.disabled ? undefined : whileHover ?? hover}
            whileTap={rest.disabled ? undefined : whileTap ?? { y: 1 }}
            transition={transition ?? timing}>
            {icon && <Icon icon={icon} />}
            {children ?? title}
        </motion.button>
    );
}
