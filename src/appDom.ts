export type AppDomNodes = {
  sourceFeed: HTMLDivElement;
  status: HTMLOutputElement;
  siteTitle: HTMLHeadingElement;
  sourceSelect: HTMLSelectElement;
  activeSourceTitle: HTMLElement;
  activeSourcePath: HTMLElement;
  tabs: HTMLElement;
  view: HTMLDivElement;
};

export const bindAppDom = (root: HTMLElement): AppDomNodes => ({
  sourceFeed: requireNode(root, "#source-feed", HTMLDivElement),
  status: requireNode(root, "#status", HTMLOutputElement),
  siteTitle: requireNode(root, "#site-title", HTMLHeadingElement),
  sourceSelect: requireNode(root, "#source-select", HTMLSelectElement),
  activeSourceTitle: requireNode(root, "#active-source-title", HTMLElement),
  activeSourcePath: requireNode(root, "#active-source-path", HTMLElement),
  tabs: requireNode(root, "#tabs", HTMLElement),
  view: requireNode(root, "#view", HTMLDivElement),
});

const requireNode = <T extends HTMLElement>(
  root: HTMLElement,
  selector: string,
  constructor: new (...args: never[]) => T,
): T => {
  const node = root.querySelector(selector);
  if (node instanceof constructor) {
    return node;
  }
  throw new Error(`missing demo DOM node: ${selector}`);
};
