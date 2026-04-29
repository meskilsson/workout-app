import type { ComponentPropsWithoutRef } from "react";
import styles from "./Footer.module.css";

type FooterProps = ComponentPropsWithoutRef<"footer">;

export default function Footer({
    children,
    className = "",
    ...rest
}: FooterProps) {
    return (
        <footer className={`${styles.footer} ${className}`} {...rest}>
            <div className={styles.footerInner}>{children}</div>
        </footer>
    );
}