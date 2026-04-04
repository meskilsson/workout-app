import type { ComponentPropsWithoutRef } from "react";

type FooterProps = ComponentPropsWithoutRef<"footer">;

export default function Footer({ children, ...rest }: FooterProps) {
    return (
        <footer {...rest}>
            {children}
        </footer>
    );
}