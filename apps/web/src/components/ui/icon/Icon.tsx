import type { LucideIcon } from "lucide-react";

type IconProps = { icon: LucideIcon; className?: string };

// Icons accompany labels, or buttons supply their own accessible name.
export default function Icon({ icon: OutlineIcon, className = "" }: IconProps) {
    return <OutlineIcon className={`ui-icon ${className}`} size={18} strokeWidth={1.75} aria-hidden="true" focusable="false" />;
}
