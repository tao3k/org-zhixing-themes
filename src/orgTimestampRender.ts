import type { OrgizeTimestampDto } from "orgize/dto";

export const renderTimestamp = (
  ownerDocument: Document,
  timestamp: OrgizeTimestampDto | null | undefined,
  fallback: string,
): HTMLElement => {
  const value = timestamp?.raw || fallback;
  const element = ownerDocument.createElement(timestamp?.start ? "time" : "span");
  element.className = `org-timestamp org-timestamp--${timestamp?.kind ?? "raw"}`;
  element.textContent = value;
  if (timestamp?.start) {
    element.setAttribute("datetime", timestampDatetime(timestamp));
  }
  if (timestamp?.isRange) {
    element.dataset.orgRange = "true";
  }
  return element;
};

const timestampDatetime = (timestamp: OrgizeTimestampDto): string => {
  const start = timestamp.start;
  if (!start) {
    return timestamp.raw;
  }
  const date = [start.year, start.month, start.day]
    .map((value, index) => (index === 0 ? String(value) : String(value).padStart(2, "0")))
    .join("-");
  if (start.hour === null || start.hour === undefined) {
    return date;
  }
  return `${date}T${String(start.hour).padStart(2, "0")}:${String(start.minute ?? 0).padStart(2, "0")}`;
};
