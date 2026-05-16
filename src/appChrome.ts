import type { SiteConfig } from "./config";
import type { ViewKey } from "./model";

export const createTabButtons = (config: SiteConfig, currentView: ViewKey): HTMLButtonElement[] =>
  config.menu.map((item) => {
    const button = document.createElement("button");
    button.dataset.view = item.view;
    button.textContent = item.name;
    button.classList.toggle("active", item.view === currentView);
    return button;
  });
