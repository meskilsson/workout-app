import { useCallback } from "react";
import { useRouter, useRouterState } from "@tanstack/react-router";
export function useLocation() {
    return useRouterState({ select: state => ({
        pathname: state.location.pathname,
        search: state.location.searchStr,
        state: state.location.state,
        key: state.location.state.__TSR_key ?? state.location.href,
    }) });
}
export function useParams(): Record<string, string | undefined> {
    return useRouterState({ select: (state): Record<string, string | undefined> => Object.assign({}, ...state.matches.map(match => match.params)) });
}
export function useNavigate() {
    const router = useRouter();
    return useCallback((to: string | number, options?: { replace?: boolean; state?: Record<string, unknown> }) => {
        if (typeof to === "number") { router.history.go(to); return; }
        void router.navigate({ to, replace: options?.replace, state: options?.state });
    }, [router]);
}
export function useSearchParams() {
    const { search } = useLocation();
    return [new URLSearchParams(search)] as const;
}
