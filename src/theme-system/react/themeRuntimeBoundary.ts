export type ThemeRuntimeBoundaryState = "pending" | "loading" | "mounting" | "mounted" | "failed";

export type ThemeRuntimeBoundarySelection = Readonly<{
  isolationId: string;
  themeId: string;
  variant: string;
}>;

export const claimThemeRuntimeBoundary = (
  selection: ThemeRuntimeBoundarySelection,
  root: HTMLElement | null = document.querySelector<HTMLElement>("#app"),
): HTMLElement => {
  if (!root) throw new Error("missing #app root");
  root.replaceChildren();
  root.dataset.themeIsolationId = selection.isolationId;
  root.dataset.themeId = selection.themeId;
  root.dataset.themeVariant = selection.variant;
  setThemeRuntimeBoundaryState(root, "loading");
  return root;
};

export const setThemeRuntimeBoundaryState = (
  root: HTMLElement,
  state: ThemeRuntimeBoundaryState,
): void => {
  root.dataset.themeRuntimeState = state;
  if (state === "pending" || state === "loading" || state === "mounting") {
    root.setAttribute("aria-busy", "true");
  } else {
    root.removeAttribute("aria-busy");
  }
};
