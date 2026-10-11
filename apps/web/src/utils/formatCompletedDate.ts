import { getOrdinalDay } from "./getOrdinalDay";
import { locale } from "../i18n";

export function formatCompletedDate(dateValue: string | Date) {
    const date = new Date(dateValue);
    if (locale() === "sv-SE") return new Intl.DateTimeFormat(locale(), { weekday: "long", day: "numeric", month: "long" }).format(date);

    const weekday = new Intl.DateTimeFormat("en-US", {
        weekday: "long",
    }).format(date);

    const month = new Intl.DateTimeFormat("en-US", {
        month: "long",
    }).format(date);

    return `${weekday} ${getOrdinalDay(date.getDate())} of ${month}`;
}
