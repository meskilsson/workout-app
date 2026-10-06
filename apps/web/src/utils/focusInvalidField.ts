// Wait for field errors to render; only call after an unsuccessful submission.
export function focusInvalidField(form: HTMLFormElement): void {
    requestAnimationFrame(() => {
        const control = form.querySelector<HTMLElement>('[aria-invalid="true"], input:invalid, select:invalid, textarea:invalid');
        if (!control?.isConnected) return;
        let ancestor: HTMLElement | null = control.parentElement;
        while (ancestor && ancestor !== form) {
            if (ancestor instanceof HTMLDetailsElement) ancestor.open = true;
            ancestor = ancestor.parentElement;
        }
        control.focus();
        control.scrollIntoView({ block: "nearest", behavior: "instant" });
    });
}
