import { useEffect } from "react";

// Keep this outside React state: Safari viewport events must not remount timers.
export function useVisibleViewport() {
    useEffect(() => {
        const viewport = window.visualViewport;
        const root = document.documentElement;
        function update() {
            const editable = document.activeElement?.matches("input, textarea, select, [contenteditable='true']") ?? false;
            const zoomed = (viewport?.scale ?? 1) > 1.05;
            const short = (viewport?.height ?? window.innerHeight) < 480;
            root.dataset.viewportObstructed = String(editable || zoomed || short);
            // Size dialog scrolling to the visible area, without constraining page zoom.
            root.style.setProperty("--visible-viewport-top", `${viewport?.offsetTop ?? 0}px`);
            root.style.setProperty("--visible-viewport-height", `${viewport?.height ?? window.innerHeight}px`);
        }
        update();
        viewport?.addEventListener("resize", update);
        viewport?.addEventListener("scroll", update);
        window.addEventListener("resize", update);
        document.addEventListener("focusin", update);
        document.addEventListener("focusout", update);
        return () => {
            viewport?.removeEventListener("resize", update);
            viewport?.removeEventListener("scroll", update);
            window.removeEventListener("resize", update);
            document.removeEventListener("focusin", update);
            document.removeEventListener("focusout", update);
            delete root.dataset.viewportObstructed;
            root.style.removeProperty("--visible-viewport-height");
            root.style.removeProperty("--visible-viewport-top");
        };
    }, []);
}
