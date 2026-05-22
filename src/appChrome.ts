import type { SiteConfig } from "./config";
import type { ViewKey } from "./model";

export const createTabButtons = (config: SiteConfig, currentView: ViewKey): HTMLButtonElement[] =>
  config.menu.map((item) => {
    const button = document.createElement("button");
    const facet = lifeFacetFor(item.view);
    button.dataset.view = item.view;
    button.className = "site-nav-item";
    button.append(navText(item.name, "span"));
    button.append(navText(facet, "small"));
    button.title = facet;
    button.classList.toggle("active", item.view === currentView);
    return button;
  });

const lifeFacetFor = (view: ViewKey): string => {
  switch (view) {
    case "blog":
      return "writing";
    case "gallery":
      return "images";
    case "records":
      return "notes / reading";
    case "memory":
      return "memory graph";
    case "travel":
      return "journeys";
    case "agenda":
      return "time";
    case "capture":
      return "capture";
    case "diagnostics":
      return "health";
  }
};

const navText = <K extends keyof HTMLElementTagNameMap>(
  text: string,
  tag: K,
): HTMLElementTagNameMap[K] => {
  const element = document.createElement(tag);
  element.textContent = text;
  return element;
};
