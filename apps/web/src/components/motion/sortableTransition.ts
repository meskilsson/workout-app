// dnd-kit supplies the same 200ms CSS-ease transition only during sorting.
export function sortableTransition(value: string | undefined, reduced: boolean | null) {
    const milliseconds = value?.match(/([\d.]+)ms/);
    return { duration: reduced || !milliseconds ? 0 : Number(milliseconds[1]) / 1000,
        ease: [0.25, 0.1, 0.25, 1] as const };
}
