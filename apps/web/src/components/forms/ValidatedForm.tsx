import { useEffect, useRef, type ComponentPropsWithRef } from "react";
import { focusInvalidField } from "../../utils/focusInvalidField";
import { validationMessage, type FormControl } from "../../utils/formValidation";

/** Enhances existing native controls without changing their layout or controlled values. */
export default function ValidatedForm({ ref, children, embedded = false, onSubmit, ...props }: ComponentPropsWithRef<"form"> & { embedded?: boolean }) {
    const localRef = useRef<HTMLFormElement | HTMLDivElement>(null);
    const pending = useRef(false);
    const refresh = useRef<() => void>(() => {});
    useEffect(() => {
        const form = localRef.current!;
        const messages = new Map<FormControl, HTMLSpanElement>();
        const clientErrors = new Set<FormControl>();
        const serverValues = new Map<FormControl, string>();
        const controls = () => Array.from(form.querySelectorAll<FormControl>("input, select, textarea")).filter(control => !control.matches(":disabled, [type=hidden]"));
        function clear(control: FormControl) {
            const message = messages.get(control);
            if (!message) return;
            const ids = (control.getAttribute("aria-describedby") ?? "").split(" ").filter(id => id && id !== message.id);
            if (ids.length) control.setAttribute("aria-describedby", ids.join(" "));
            else control.removeAttribute("aria-describedby");
            control.removeAttribute("aria-invalid");
            message.remove(); messages.delete(control);
            serverValues.delete(control);
        }
        function show(control: FormControl, text: string, client = true) {
            clear(control);
            if (client) clientErrors.add(control); else clientErrors.delete(control);
            if (!text) return;
            const message = document.createElement("span");
            message.id = `inline-validation-${++nextMessageId}`;
            message.className = "inline-field-error";
            message.setAttribute("role", "alert");
            message.textContent = text;
            control.insertAdjacentElement("afterend", message);
            control.setAttribute("aria-invalid", "true");
            control.setAttribute("aria-describedby", [control.getAttribute("aria-describedby"), message.id].filter(Boolean).join(" "));
            messages.set(control, message);
            if (!client) serverValues.set(control, control.value);
        }
        function submit(event: Event) {
            if (event.type === "click" && !(event.target as Element).closest("[data-validate]")) return;
            let invalid = false;
            for (const control of controls()) {
                const message = validationMessage(control);
                show(control, message);
                invalid ||= Boolean(message);
            }
            if (invalid) { event.preventDefault(); event.stopPropagation(); focusInvalidField(form); }
        }
        function edit(event: Event) {
            if (!(event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement || event.target instanceof HTMLTextAreaElement)) return;
            if (messages.has(event.target)) show(event.target, validationMessage(event.target));
            if (event.target.name === "newPassword") {
                const confirmation = controls().find(control => control.name === "confirmPassword");
                if (confirmation && messages.has(confirmation)) show(confirmation, validationMessage(confirmation));
            }
        }
        function serverErrors(event: Event) {
            const fields = (event as CustomEvent<Record<string, string>>).detail;
            let matched = false, unmatched = false;
            for (const [field, text] of Object.entries(fields)) {
                const control = controls().find(control => control.name === field || control.id === field);
                if (control) { show(control, text, false); matched = true; } else unmatched = true;
            }
            if (matched) focusInvalidField(form);
            if (matched && !unmatched) event.preventDefault();
        }
        form.addEventListener("submit", submit, true);
        form.addEventListener("input", edit);
        form.addEventListener("change", edit);
        form.addEventListener("form-field-errors", serverErrors);
        if (embedded) form.addEventListener("click", submit, true);
        refresh.current = () => {
            for (const control of messages.keys()) {
                if (!form.contains(control)) { clear(control); clientErrors.delete(control); }
                else if (serverValues.has(control) && serverValues.get(control) !== control.value) clear(control);
                else if (clientErrors.has(control)) {
                    const text = validationMessage(control);
                    if (text !== messages.get(control)?.textContent) show(control, text);
                }
            }
        };
        return () => {
            form.removeEventListener("submit", submit, true); form.removeEventListener("input", edit);
            form.removeEventListener("change", edit); form.removeEventListener("form-field-errors", serverErrors);
            form.removeEventListener("click", submit, true);
            refresh.current = () => {};
            for (const control of messages.keys()) clear(control);
        };
    }, [embedded]);
    useEffect(() => { refresh.current(); });
    if (embedded) return <div className={props.className} ref={element => { localRef.current = element; }}>{children}</div>;
    return <form {...props} noValidate onSubmit={event => {
        if (pending.current) { event.preventDefault(); return; }
        pending.current = true;
        try { Promise.resolve(onSubmit?.(event)).finally(() => { pending.current = false; }); }
        catch (error) { pending.current = false; throw error; }
    }} ref={element => {
        localRef.current = element;
        if (typeof ref === "function") ref(element);
        else if (ref) ref.current = element;
    }}>{children}</form>;
}

let nextMessageId = 0;
