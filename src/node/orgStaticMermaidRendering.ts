import { fileURLToPath } from "node:url";

import { findMermaidSourceBlocks } from "../react/mermaidDiagrams";

export const staticMermaidVariants = ["latte", "frappe", "macchiato", "mocha"] as const;
export type StaticMermaidVariant = (typeof staticMermaidVariants)[number];
export type StaticMermaidRenderer = (
  source: string,
  variant: StaticMermaidVariant,
) => Promise<string>;

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

let diagramSequence = 0;
type MermaidRenderRequest = {
  id: string;
  source: string;
  variant: StaticMermaidVariant;
};

const mermaidConfig = (variant: StaticMermaidVariant) => {
  const palette = mermaidPalette[variant];
  return {
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
  } as const;
};

const renderMermaidBatch = async (requests: readonly MermaidRenderRequest[]): Promise<string[]> => {
  if (requests.length === 0) return [];
  const { chromium } = await import("@playwright/test");
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent("<!doctype html><html><body></body></html>");
    const mermaidEntry = import.meta.resolve("mermaid");
    await page.addScriptTag({
      path: fileURLToPath(new URL("./mermaid.min.js", mermaidEntry)),
    });
    const rendered: string[] = [];
    for (const request of requests) {
      rendered.push(
        await page.evaluate(
          async ({ config, id, source }) => {
            const mermaid = (
              window as unknown as {
                mermaid: {
                  initialize: (value: object) => void;
                  render: (renderId: string, text: string) => Promise<{ svg: string }>;
                };
              }
            ).mermaid;
            mermaid.initialize(config);
            return (await mermaid.render(id, source)).svg;
          },
          { config: mermaidConfig(request.variant), id: request.id, source: request.source },
        ),
      );
    }
    return rendered;
  } finally {
    await browser.close();
  }
};

const appendPreview = (
  document: Document,
  block: HTMLPreElement,
  variant: StaticMermaidVariant,
  svg: string,
): void => {
  const template = document.createElement("template");
  template.dataset.orgMermaidStaticPreview = variant;
  template.innerHTML = svg;
  block.before(template);
};

const renderWithInjectedRenderer = async (
  document: Document,
  blocks: readonly HTMLPreElement[],
  render: StaticMermaidRenderer,
): Promise<void> => {
  for (const block of blocks) {
    const source = block.textContent ?? "";
    for (const variant of staticMermaidVariants) {
      appendPreview(document, block, variant, await render(source, variant));
    }
  }
};

const renderWithBrowser = async (
  document: Document,
  blocks: readonly HTMLPreElement[],
): Promise<void> => {
  const requests = blocks.flatMap((block) =>
    staticMermaidVariants.map((variant) => ({
      id: `org-zhixing-static-${++diagramSequence}`,
      source: block.textContent ?? "",
      variant,
    })),
  );
  const rendered = await renderMermaidBatch(requests);
  requests.forEach((request, index) => {
    const block = blocks[Math.floor(index / staticMermaidVariants.length)];
    if (block) appendPreview(document, block, request.variant, rendered[index] ?? "");
  });
};

/**
 * Pre-renders every built-in palette. The browser only clones the matching
 * template, so a first visit has no Mermaid parser or network work to do.
 */
export const renderOrgStaticMermaidDocument = async (
  document: Document,
  render?: StaticMermaidRenderer,
): Promise<void> => {
  const blocks = findMermaidSourceBlocks(document).filter(
    (block) =>
      block.previousElementSibling?.matches("template[data-org-mermaid-static-preview]") !== true,
  );

  if (render) await renderWithInjectedRenderer(document, blocks, render);
  else await renderWithBrowser(document, blocks);
};
