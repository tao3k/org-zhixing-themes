import type { AgendaPlanningEntry } from "./agendaTypes";
import {
  hasExplicitOrgPriority,
  orgPriorityLabel,
  orgPriorityTone,
  orgTodoTone,
  type OrgPriorityLike,
} from "./orgSemanticTone";

export const renderOrgTodoBadge = (
  todo: string | null | undefined,
  todoState: "todo" | "done" | null | undefined,
): string =>
  todo
    ? `<span class="org-heading-todo org-heading-todo--${orgTodoTone(todo, todoState)}">${escapeHtml(todo)}</span>`
    : "";

export const renderOrgMetaRow = (
  children: string[],
  options: { rowClassName?: string } = {},
): string => {
  const visibleChildren = children.filter(Boolean);
  if (visibleChildren.length === 0) {
    return "";
  }
  const rowClassName = ["org-meta-row", options.rowClassName].filter(Boolean).join(" ");
  return `<div class="${rowClassName}">${visibleChildren.join("")}</div>`;
};

export const renderOrgPriorityBadge = (priority: OrgPriorityLike | null | undefined): string =>
  priority && hasExplicitOrgPriority(priority)
    ? `<span class="org-heading-priority org-priority--${orgPriorityTone(priority)}">${escapeHtml(orgPriorityLabel(priority))}</span>`
    : "";

export const renderOrgPlanningChip = (entry: AgendaPlanningEntry): string => `
  <span class="org-meta-chip org-planning-chip org-planning-chip--${entry.kind} org-meta-chip--${entry.kind}">
    <b class="org-planning-label">${escapeHtml(entry.label)}</b>
    <span class="org-timestamp org-timestamp--raw">${escapeHtml(entry.value)}</span>
  </span>
`;

export const renderOrgTagBadge = (tag: string): string =>
  `<span class="org-meta-tag">${escapeHtml(tag)}</span>`;

export const renderOrgTagBadges = (tags: Array<string | null | undefined>): string[] =>
  tags.filter((tag): tag is string => Boolean(tag)).map((tag) => renderOrgTagBadge(tag));

export const renderOrgTagRow = (
  tags: Array<string | null | undefined>,
  options: { rowClassName?: string } = {},
): string =>
  renderOrgMetaRow(renderOrgTagBadges(tags), {
    rowClassName: ["org-meta-row--tags", options.rowClassName].filter(Boolean).join(" "),
  });

const escapeHtml = (value: string | number): string =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
