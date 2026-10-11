import { useCallback, useEffect, useRef, useState } from "react";
import { scrollIntoView } from "../components/motion/scrollIntoView";

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
    const cancelScroll = useRef<(() => void) | undefined>(undefined);
    useEffect(() => () => cancelScroll.current?.(), []);

    const handlePageChange = useCallback(
        (nextPage: number) => {
            const safeTotalPages = Math.max(totalPages, 1);
            const safePage = Math.min(Math.max(nextPage, 1), safeTotalPages);

            setPage(safePage);

            requestAnimationFrame(() => {
                cancelScroll.current?.();
                if (pageTopRef.current) cancelScroll.current = scrollIntoView(pageTopRef.current, behavior, block);
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
