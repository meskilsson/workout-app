import { useCallback, useRef, useState } from "react";

type UsePaginationScrollOptions = {
    page?: number;
    onPageChange?: React.Dispatch<React.SetStateAction<number>>;
    initialPage?: number;
    behavior?: ScrollBehavior;
    block?: ScrollLogicalPosition;
}

export function usePaginationScroll<TElement extends HTMLElement>(
    totalPages: number,
    {
        initialPage = 1,
        page: controlledPage,
        onPageChange,
        behavior = "smooth",
        block = "start",
    }: UsePaginationScrollOptions = {},
) {
    const [localPage, setLocalPage] = useState(initialPage);
    const page = controlledPage ?? localPage;
    const setPage = onPageChange ?? setLocalPage;
    const pageTopRef = useRef<TElement | null>(null);

    const handlePageChange = useCallback(
        (nextPage: number) => {
            const safeTotalPages = Math.max(totalPages, 1);
            const safePage = Math.min(Math.max(nextPage, 1), safeTotalPages);

            setPage(safePage);

            requestAnimationFrame(() => {
                pageTopRef.current?.scrollIntoView({
                    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : behavior,
                    block,
                });
            });
        },
        [totalPages, behavior, block, setPage],
    );

    return {
        page,
        setPage,
        pageTopRef,
        handlePageChange,
    };
}
