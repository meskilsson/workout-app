import { getOrdinalDay } from "./getOrdinalDay";

export function formatCompletedDate(dateValue: string | Date) {
    const date = new Date(dateValue);

    const weekday = new Intl.DateTimeFormat("en-US", {
        weekday: "long",
    }).format(date);

    const month = new Intl.DateTimeFormat("en-US", {
        month: "long",
    }).format(date);

    return `${weekday} ${getOrdinalDay(date.getDate())} of ${month}`;
}