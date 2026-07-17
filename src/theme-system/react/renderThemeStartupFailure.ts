export const renderThemeStartupFailure = (
  error: unknown,
  retry: () => void,
  root: HTMLElement | null = document.querySelector<HTMLElement>("#app"),
): void => {
  if (!root) return;
  const message = error instanceof Error ? error.message : String(error);
  const surface = document.createElement("main");
  surface.className = "theme-startup-failure";
  surface.setAttribute("role", "alert");

  const title = document.createElement("h1");
  title.textContent = "Theme unavailable";
  const detail = document.createElement("p");
  detail.textContent = `THEME-E034 ${message}`;
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "Retry theme";
  button.addEventListener("click", retry, { once: true });

  surface.append(title, detail, button);
  root.replaceChildren(surface);
};
