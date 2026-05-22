export type AppDomNodes = {
  sourceFeed: HTMLDivElement;
  sourcePicker: HTMLElement;
  status: HTMLOutputElement;
  siteTitle: HTMLHeadingElement;
  activeSourceTitle: HTMLElement;
  activeSourcePath: HTMLElement;
  tabs: HTMLElement;
  view: HTMLDivElement;
};

export const bindAppDom = (root: HTMLElement): AppDomNodes => ({
  sourceFeed: requireNode(root, "#source-feed", HTMLDivElement),
  sourcePicker: requireNode(root, "#source-picker", HTMLElement),
  status: requireNode(root, "#status", HTMLOutputElement),
  siteTitle: requireNode(root, "#site-title", HTMLHeadingElement),
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
