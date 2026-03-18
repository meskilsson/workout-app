import type { InputHTMLAttributes } from "react"

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
    label: string;
    error?: string;
}


export default function Input({ label, id, name, error, ...rest }: InputProps) {

    const inputId = id || name;

    return (
        <div>
            <label htmlFor={inputId}>{label}</label>
            <input id={inputId} name={name} {...rest} />
            {error && <p>{error}</p>}
        </div>
    )
}