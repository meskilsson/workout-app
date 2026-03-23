import type { InputHTMLAttributes } from "react";
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
    const inputId = id || name;

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
                className={className ?? "input-field"}
                {...rest}
            />

            {error && <p className={errorClassName ?? "input-error"}>{error}</p>}
        </div>
    );
}