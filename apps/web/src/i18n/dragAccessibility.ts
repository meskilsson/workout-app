import type { Announcements } from "@dnd-kit/core";
import { t } from ".";

export function dragAccessibility(items: { id: string; name: string }[]) {
    const name = (id: string | number) => items.find(item => item.id === id)?.name ?? t("common.exercise");
    const announcements: Announcements = {
        onDragStart: ({ active }) => t("drag.pickedUp", { name: name(active.id) }),
        onDragOver: ({ active, over }) => over ? t("drag.over", { name: name(active.id), target: name(over.id) }) : undefined,
        onDragEnd: ({ active, over }) => over ? t("drag.dropped", { name: name(active.id), position: items.findIndex(item => item.id === over.id) + 1 }) : t("drag.cancelled"),
        onDragCancel: () => t("drag.cancelled"),
    };
    return { announcements, screenReaderInstructions: { draggable: t("drag.instructions") } };
}
