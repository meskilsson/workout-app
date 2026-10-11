import { animate } from "motion/react";

// Let the browser resolve nested scroll containers and alignment, then use
// Motion to play the existing pagination scroll rather than native animation.
export function scrollIntoView(element: HTMLElement, behavior: ScrollBehavior, block: ScrollLogicalPosition) {
    if (behavior !== "smooth" || matchMedia("(prefers-reduced-motion: reduce)").matches) {
        element.scrollIntoView({ behavior: "instant", block });
        return () => {};
    }
    const containers = new Set<Element>();
    for (let parent = element.parentElement; parent; parent = parent.parentElement) containers.add(parent);
    if (document.scrollingElement) containers.add(document.scrollingElement);
    const positions = [...containers].map(node => ({ node, top: node.scrollTop, left: node.scrollLeft }));
    element.scrollIntoView({ behavior: "instant", block });
    const targets = positions.map(position => ({ ...position, endTop: position.node.scrollTop, endLeft: position.node.scrollLeft }));
    positions.forEach(({ node, top, left }) => { node.scrollTop = top; node.scrollLeft = left; });
    const controls = targets.filter(({ top, left, endTop, endLeft }) => top !== endTop || left !== endLeft)
        .map(({ node, top, left, endTop, endLeft }) => animate(0, 1, {
            duration: 0.35, ease: [0.25, 0.1, 0.25, 1],
            onUpdate: progress => { node.scrollTop = top + (endTop - top) * progress; node.scrollLeft = left + (endLeft - left) * progress; },
        }));
    const events = ["wheel", "touchstart", "pointerdown", "keydown"];
    const stop = () => {
        controls.forEach(control => control.stop());
        events.forEach(event => document.removeEventListener(event, stop, true));
    };
    events.forEach(event => document.addEventListener(event, stop, { capture: true, passive: true }));
    void Promise.all(controls).then(stop);
    return stop;
}
