import { useEffect } from "react";

// Keep this outside React state: Safari viewport events must not remount timers.
export function useVisibleViewport() {
    useEffect(() => {
        const viewport = window.visualViewport;
        const root = document.documentElement;
        function update() {
            const editable = document.activeElement?.matches("input:not([type='checkbox']):not([type='radio']):not([type='range']):not([type='button']):not([type='submit']):not([type='file']), textarea, select, [contenteditable='true']") ?? false;
            const touchInput = editable && window.matchMedia("(hover: none) and (pointer: coarse)").matches;
            const zoomed = (viewport?.scale ?? 1) > 1.05;
            const short = (viewport?.height ?? window.innerHeight) < 480;
            root.dataset.viewportObstructed = String(touchInput || zoomed || short);
            // Size dialog scrolling to the visible area, without constraining page zoom.
            root.style.setProperty("--visible-viewport-top", `${viewport?.offsetTop ?? 0}px`);
            root.style.setProperty("--visible-viewport-height", `${viewport?.height ?? window.innerHeight}px`);
        }
        update();
        let focusFrame = 0;
        function updateAfterFocus() {
            cancelAnimationFrame(focusFrame);
            focusFrame = requestAnimationFrame(update);
        }
        viewport?.addEventListener("resize", update);
        viewport?.addEventListener("scroll", update);
        window.addEventListener("resize", update);
        document.addEventListener("focusin", updateAfterFocus);
        document.addEventListener("focusout", updateAfterFocus);
        return () => {
            viewport?.removeEventListener("resize", update);
            viewport?.removeEventListener("scroll", update);
            window.removeEventListener("resize", update);
            document.removeEventListener("focusin", updateAfterFocus);
            document.removeEventListener("focusout", updateAfterFocus);
            cancelAnimationFrame(focusFrame);
            delete root.dataset.viewportObstructed;
            root.style.removeProperty("--visible-viewport-height");
            root.style.removeProperty("--visible-viewport-top");
        };
    }, []);
}
