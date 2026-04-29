import type { ComponentPropsWithoutRef } from "react";

type FooterProps = ComponentPropsWithoutRef<"footer">;

export default function Footer({ children, className = "", ...rest }: FooterProps) {
    return (
        <footer className={className} {...rest}>
            {children}
        </footer>
    );
}