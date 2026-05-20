import type { AgendaSettings } from "./config";
import type { AgendaItem } from "./model";

type AgendaDate = AgendaSettings["start"];

export const sourcePlanningAgendaRange = (
  items: AgendaItem[],
  fallback: AgendaSettings,
): AgendaSettings | null => {
  const dates = items.flatMap((item) => planningDates(item.value));
  if (dates.length === 0) {
    return null;
  }
  const start = dates.reduce((left, right) => (compareDate(left, right) <= 0 ? left : right));
  const end = dates.reduce((left, right) => (compareDate(left, right) >= 0 ? left : right));
  return {
    ...fallback,
    start,
    end,
    days: daysBetween(start, end) + 1,
    label: agendaRangeLabel(start, end),
  };
};

export const sameAgendaRange = (left: AgendaSettings, right: AgendaSettings): boolean =>
  compareDate(left.start, right.start) === 0 && compareDate(left.end, right.end) === 0;

const planningDates = (value: string): AgendaDate[] =>
  [...value.matchAll(/(?:<|\[)(\d{4})-(\d{2})-(\d{2})/g)].map((match) => ({
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  }));

const agendaRangeLabel = (start: AgendaDate, end: AgendaDate): string =>
  compareDate(start, end) === 0 ? formatDate(start) : `${formatDate(start)} - ${formatDate(end)}`;

const compareDate = (left: AgendaDate, right: AgendaDate): number =>
  dateMs(left) === dateMs(right) ? 0 : dateMs(left) < dateMs(right) ? -1 : 1;

const daysBetween = (start: AgendaDate, end: AgendaDate): number =>
  Math.max(0, Math.round((dateMs(end) - dateMs(start)) / 86_400_000));

const dateMs = (date: AgendaDate): number => Date.UTC(date.year, date.month - 1, date.day);

const formatDate = (date: AgendaDate): string =>
  `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
