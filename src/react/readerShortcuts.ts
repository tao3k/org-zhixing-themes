export const isZenModeShortcut = (
  event: Pick<KeyboardEvent, "altKey" | "ctrlKey" | "key" | "metaKey">,
): boolean => event.key.toLowerCase() === "z" && event.metaKey && !event.ctrlKey && !event.altKey;

export const isEditableKeyboardTarget = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  (target.isContentEditable || target.matches("input, textarea, select, [contenteditable='true']"));
