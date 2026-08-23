import { Window } from "happy-dom";

import { findMermaidSourceBlocks } from "../react/mermaidDiagrams";

export const staticMermaidVariants = ["latte", "frappe", "macchiato", "mocha"] as const;
export type StaticMermaidVariant = (typeof staticMermaidVariants)[number];
export type StaticMermaidRenderer = (
  source: string,
  variant: StaticMermaidVariant,
) => Promise<string>;

type MermaidApi = (typeof import("mermaid"))["default"];

const mermaidPalette: Readonly<Record<StaticMermaidVariant, Record<string, string>>> = {
  latte: {
    background: "#eff1f5",
    primary: "#e6e9ef",
    text: "#4c4f69",
    border: "#1e66f5",
    line: "#9ca0b0",
    secondary: "#dce0e8",
    tertiary: "#ccd0da",
  },
  frappe: {
    background: "#303446",
    primary: "#414559",
    text: "#c6d0f5",
    border: "#8caaee",
    line: "#a5adce",
    secondary: "#292c3c",
    tertiary: "#232634",
  },
  macchiato: {
    background: "#24273a",
    primary: "#363a4f",
    text: "#cad3f5",
    border: "#8aadf4",
    line: "#a5adcb",
    secondary: "#1e2030",
    tertiary: "#181926",
  },
  mocha: {
    background: "#1e1e2e",
    primary: "#313244",
    text: "#cdd6f4",
    border: "#89b4fa",
    line: "#6c7086",
    secondary: "#181825",
    tertiary: "#11111b",
  },
};

let mermaidModule: Promise<MermaidApi> | null = null;
let diagramSequence = 0;

const mermaidWindow = new Window();
const domGlobals = {
  window: mermaidWindow,
  document: mermaidWindow.document,
  Element: mermaidWindow.Element,
  HTMLElement: mermaidWindow.HTMLElement,
  Node: mermaidWindow.Node,
  SVGElement: mermaidWindow.SVGElement,
  DOMParser: mermaidWindow.DOMParser,
  XMLSerializer: mermaidWindow.XMLSerializer,
  getComputedStyle: mermaidWindow.getComputedStyle.bind(mermaidWindow),
  requestAnimationFrame: mermaidWindow.requestAnimationFrame.bind(mermaidWindow),
  cancelAnimationFrame: mermaidWindow.cancelAnimationFrame.bind(mermaidWindow),
} as const;

const withMermaidDom = async <Value>(operation: () => Promise<Value>): Promise<Value> => {
  const previous = new Map<string, PropertyDescriptor | undefined>();
  for (const [name, value] of Object.entries(domGlobals)) {
    previous.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    Object.defineProperty(globalThis, name, {
      configurable: true,
      value,
      writable: true,
    });
  }
  try {
    return await operation();
  } finally {
    for (const [name, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else Reflect.deleteProperty(globalThis, name);
    }
  }
};

const loadMermaid = (): Promise<MermaidApi> => {
  mermaidModule ??= withMermaidDom(async () => (await import("mermaid")).default);
  return mermaidModule;
};

const renderMermaid: StaticMermaidRenderer = async (source, variant) => {
  const palette = mermaidPalette[variant];
  return withMermaidDom(async () => {
    const mermaid = await loadMermaid();
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      suppressErrorRendering: true,
      maxEdges: 1_000,
      maxTextSize: 50_000,
      theme: "base",
      darkMode: variant !== "latte",
      fontFamily: "inherit",
      themeVariables: {
        background: palette.background,
        primaryColor: palette.primary,
        primaryTextColor: palette.text,
        primaryBorderColor: palette.border,
        lineColor: palette.line,
        secondaryColor: palette.secondary,
        tertiaryColor: palette.tertiary,
      },
    });
    const { svg } = await mermaid.render(`org-zhixing-static-${++diagramSequence}`, source);
    return svg;
  });
};

/**
 * Pre-renders every built-in palette. The browser only clones the matching
 * template, so a first visit has no Mermaid parser or network work to do.
 */
export const renderOrgStaticMermaidDocument = async (
  document: Document,
  render: StaticMermaidRenderer = renderMermaid,
): Promise<void> => {
  const blocks = findMermaidSourceBlocks(document).filter(
    (block) =>
      block.previousElementSibling?.matches("template[data-org-mermaid-static-preview]") !== true,
  );

  for (const block of blocks) {
    const source = block.textContent ?? "";
    for (const variant of staticMermaidVariants) {
      const template = document.createElement("template");
      template.dataset.orgMermaidStaticPreview = variant;
      template.innerHTML = await render(source, variant);
      block.before(template);
    }
  }
};
