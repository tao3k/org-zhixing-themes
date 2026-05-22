export type OrgPriorityLike = {
  effective: string;
  isDefault: boolean;
  raw?: string | null;
};

export type OrgTodoTone = "done" | "focus" | "todo" | "waiting";

export const orgTodoTone = (
  todo: string | null | undefined,
  todoState: "todo" | "done" | null | undefined,
): OrgTodoTone => {
  if (todoState === "done") {
    return "done";
  }
  const normalized = todo?.toLowerCase() ?? "";
  if (["wait", "waiting", "hold", "blocked"].includes(normalized)) {
    return "waiting";
  }
  if (["next", "today", "review"].includes(normalized)) {
    return "focus";
  }
  return "todo";
};

export const hasExplicitOrgPriority = (priority: OrgPriorityLike): boolean =>
  Boolean(priority.raw) || !priority.isDefault;

export const orgPriorityLabel = (priority: OrgPriorityLike): string =>
  priority.raw?.trim() || `#${priority.effective}`;

export const orgPriorityTone = (priority: OrgPriorityLike): "a" | "b" | "c" => {
  const normalized = priority.effective.toLowerCase();
  if (normalized === "a") return "a";
  if (normalized === "b") return "b";
  return "c";
};
