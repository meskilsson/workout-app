import { useId, type InputHTMLAttributes } from "react";
import "./input.css";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
    label?: string;
    error?: string;
    wrapperClassName?: string;
    labelClassName?: string;
    errorClassName?: string;
};

export default function Input({
    label,
    id,
    name,
    error,
    className,
    wrapperClassName,
    labelClassName,
    errorClassName,
    ...rest
}: InputProps) {
    const generatedId = useId();
    const inputId = id || name || generatedId;
    const errorId = `${inputId}-error`;

    return (
        <div className={wrapperClassName ?? "input-wrapper"}>
            {label && (
                <label
                    htmlFor={inputId}
                    className={labelClassName ?? "input-label"}
                >
                    {label}
                </label>
            )}

            <input
                id={inputId}
                name={name}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errorId : undefined}
                className={className ?? "input-field"}
                {...rest}
            />

            {error && <p id={errorId} role="alert" className={errorClassName ?? "input-error"}>{error}</p>}
        </div>
    );
}