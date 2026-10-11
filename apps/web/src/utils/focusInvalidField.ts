// Wait for field errors to render; only call after an unsuccessful submission.
export function focusInvalidField(form: HTMLElement): void {
    requestAnimationFrame(() => {
        const control = Array.from(form.querySelectorAll<HTMLElement>('[aria-invalid="true"], input:invalid, select:invalid, textarea:invalid'))
            .find(element => !element.matches(':disabled, [type="hidden"]'));
        if (!control?.isConnected) return;
        let ancestor: HTMLElement | null = control.parentElement;
        while (ancestor && ancestor !== form) {
            if (ancestor instanceof HTMLDetailsElement) ancestor.open = true;
            ancestor = ancestor.parentElement;
        }
        control.focus({ preventScroll: true });
        // Center the field with room for its message, sticky navigation and the keyboard.
        control.scrollIntoView({ block: "center", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
        // Safari opens its keyboard after focus. Recheck the actual visible viewport
        // once it resizes, without moving focus away from the field being corrected.
        const viewport = window.visualViewport;
        if (viewport) {
            const keepVisible = () => {
                if (!control.isConnected || document.activeElement !== control) return;
                const bounds = control.getBoundingClientRect();
                const messageId = control.getAttribute("aria-describedby")?.split(" ").at(-1);
                const message = messageId ? document.getElementById(messageId)?.getBoundingClientRect() : undefined;
                const top = viewport.offsetTop + (parseFloat(getComputedStyle(control).scrollMarginTop) || 16);
                const bottom = viewport.offsetTop + viewport.height - 24;
                const end = message?.bottom ?? bounds.bottom;
                let scrollParent = control.parentElement;
                while (scrollParent && !(scrollParent.scrollHeight > scrollParent.clientHeight && /auto|scroll/.test(getComputedStyle(scrollParent).overflowY))) scrollParent = scrollParent.parentElement;
                const scrollTarget = scrollParent ?? window;
                if (bounds.top < top) scrollTarget.scrollBy({ top: bounds.top - top, behavior: "instant" });
                else if (end > bottom) scrollTarget.scrollBy({ top: Math.min(end - bottom, bounds.top - top), behavior: "instant" });
            };
            viewport.addEventListener("resize", keepVisible, { once: true });
            setTimeout(() => viewport.removeEventListener("resize", keepVisible), 1500);
        }
    });
}
