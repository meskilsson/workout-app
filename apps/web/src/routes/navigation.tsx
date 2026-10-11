import type { ReactNode } from "react";
import { useLocation } from "./navigationHooks";
import { motion, type HTMLMotionProps } from "motion/react";
import { createLink, Navigate as RouterNavigate } from "@tanstack/react-router";
import { useMotionTransition } from "../components/motion/useMotionTransition";
export { Outlet } from "@tanstack/react-router";

const MotionRouterLink = createLink(motion.a);
type LinkProps = Omit<HTMLMotionProps<"a">, "href" | "children"> & { children?: ReactNode; to: string; state?: Record<string, unknown> };
export function Link({ to, state, ...props }: LinkProps) {
    return <MotionRouterLink to={to} state={state} initial={false} {...props} />;
}
export function NavLink({ className, end, to, animated, ...props }: Omit<LinkProps, "className"> & {
    animated?: boolean; end?: boolean; className?: string | ((state: { isActive: boolean }) => string | undefined);
}) {
    const transition = useMotionTransition(0.18);
    const { pathname } = useLocation();
    const isActive = pathname === to || (!end && to !== "/" && pathname.startsWith(to + "/"));
    return <Link to={to} aria-current={isActive ? "page" : undefined}
        animate={animated ? { x: 0, color: isActive ? "var(--color-primary-text)" : "var(--color-text-muted)",
            backgroundColor: isActive ? "var(--color-primary-soft)" : "transparent",
            borderColor: isActive ? "var(--color-primary-border)" : "transparent" } : undefined}
        whileHover={animated ? { x: "var(--nav-hover-x)", color: "var(--color-text)",
            backgroundColor: "var(--nav-hover-background)",
            borderColor: "var(--nav-hover-border)" } : undefined}
        transition={transition}
        className={typeof className === "function" ? className({ isActive }) : className} {...props} />;
}
export function Navigate({ to, replace }: { to: string; replace?: boolean }) {
    return <RouterNavigate to={to} replace={replace} />;
}
