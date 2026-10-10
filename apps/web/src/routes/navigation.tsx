import { useLocation } from "./navigationHooks";
import { type AnchorHTMLAttributes } from "react";
import { Link as RouterLink, Navigate as RouterNavigate } from "@tanstack/react-router";
export { Outlet } from "@tanstack/react-router";

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { to: string; state?: Record<string, unknown> };
export function Link({ to, state, ...props }: LinkProps) {
    return <RouterLink to={to} state={state} {...props} />;
}
export function NavLink({ className, end, to, ...props }: Omit<LinkProps, "className"> & {
    end?: boolean; className?: string | ((state: { isActive: boolean }) => string | undefined);
}) {
    const { pathname } = useLocation();
    const isActive = pathname === to || (!end && to !== "/" && pathname.startsWith(to + "/"));
    return <Link to={to} aria-current={isActive ? "page" : undefined}
        className={typeof className === "function" ? className({ isActive }) : className} {...props} />;
}
export function Navigate({ to, replace }: { to: string; replace?: boolean }) {
    return <RouterNavigate to={to} replace={replace} />;
}
