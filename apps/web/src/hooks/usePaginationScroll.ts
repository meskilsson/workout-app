import { useCallback, useRef, useState } from "react";

type UsePaginationScrollOptions = {
    initialPage?: number;
    behavior?: ScrollBehavior;
    block?: ScrollLogicalPosition;
}

export function usePaginationScroll<TElement extends HTMLElement>(
    totalPages: number,
    {
        initialPage = 1,
        behavior = "smooth",
        block = "start",
    }: UsePaginationScrollOptions = {},
) {
    const [page, setPage] = useState(initialPage);
    const pageTopRef = useRef<TElement | null>(null);

    const handlePageChange = useCallback(
        (nextPage: number) => {
            const safeTotalPages = Math.max(totalPages, 1);
            const safePage = Math.min(Math.max(nextPage, 1), safeTotalPages);

            setPage(safePage);

            requestAnimationFrame(() => {
                pageTopRef.current?.scrollIntoView({
                    behavior,
                    block,
                });
            });
        },
        [totalPages, behavior, block],
    );

    return {
        page,
        setPage,
        pageTopRef,
        handlePageChange,
    };
}