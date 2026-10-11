import type { ReactNode } from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { useMotionTransition } from "../../motion/useMotionTransition";

type CardProps = HTMLMotionProps<"div"> & {
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
    transition,
    ...rest
}: CardProps) {
    const timing = useMotionTransition(0.2);
    return (
        <motion.div className={`card card--${variant} ${className}`.trim()}
            role={onClick ? "button" : undefined}
            tabIndex={onClick ? 0 : undefined}
            {...rest}
            initial={false}
            transition={transition ?? timing}
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
        </motion.div>
    );
}
