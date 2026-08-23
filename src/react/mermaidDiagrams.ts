/** Core progressive enhancement for Mermaid source blocks in rendered Org HTML. */
type MermaidApi = (typeof import("mermaid"))["default"];

type MermaidFigure = HTMLElement & {
  dataset: DOMStringMap & {
    mermaidQueued?: string;
    mermaidSource?: string;
    mermaidStaticPreview?: string;
    mermaidState?: string;
    mermaidVariant?: string;
  };
};

type MermaidLoader = () => Promise<MermaidApi>;

const mermaidSourceSelector = [
  "pre.src-mermaid",
  "pre.mermaid",
  'pre[data-language="mermaid"]',
  "pre > code.language-mermaid",
  'pre > code[data-language="mermaid"]',
].join(",");

let mermaidModule: Promise<MermaidApi> | null = null;
let diagramSequence = 0;
const initializedThemes = new WeakMap<object, string>();
const preparedMark = "org-zhixing:mermaid-prepared";
const firstReadyMark = "org-zhixing:mermaid-first-ready";

const activeVariant = (): string => document.documentElement.dataset.themeVariant ?? "mocha";

const markOnce = (name: string): void => {
  if (typeof performance === "undefined") return;
  if (performance.getEntriesByName(name).length === 0) performance.mark(name);
};

const loadMermaid: MermaidLoader = () => {
  mermaidModule ??= import("mermaid").then(({ default: mermaid }) => mermaid);
  return mermaidModule;
};

export const findMermaidSourceBlocks = (root: ParentNode): HTMLPreElement[] => {
  const blocks = new Set<HTMLPreElement>();
  for (const candidate of root.querySelectorAll<HTMLElement>(mermaidSourceSelector)) {
    const block = candidate instanceof HTMLPreElement ? candidate : candidate.closest("pre");
    if (block) blocks.add(block);
  }
  return [...blocks];
};

const staticPreviewTemplates = (block: HTMLPreElement): HTMLTemplateElement[] => {
  const templates: HTMLTemplateElement[] = [];
  let sibling = block.previousElementSibling;
  while (sibling instanceof HTMLTemplateElement && sibling.dataset.orgMermaidStaticPreview) {
    templates.unshift(sibling);
    sibling = sibling.previousElementSibling;
  }
  return templates;
};

const applyStaticPreview = (figure: MermaidFigure, variant: string): boolean => {
  const template = [
    ...figure.querySelectorAll<HTMLTemplateElement>("template[data-org-mermaid-static-preview]"),
  ].find((candidate) => candidate.dataset.orgMermaidStaticPreview === variant);
  const canvas = figure.querySelector<HTMLElement>(".org-mermaid-canvas");
  if (!template || !canvas) return false;
  canvas.replaceChildren(template.content.cloneNode(true));
  figure.querySelector<HTMLDetailsElement>(".org-mermaid-source")?.removeAttribute("open");
  figure.dataset.mermaidStaticPreview = "true";
  figure.dataset.mermaidState = "ready";
  figure.dataset.mermaidVariant = variant;
  figure.removeAttribute("aria-busy");
  markOnce(firstReadyMark);
  return true;
};

export const prepareMermaidFigures = (root: ParentNode): MermaidFigure[] =>
  findMermaidSourceBlocks(root).map((block) => {
    const existing = block.closest<MermaidFigure>("figure[data-mermaid-state]");
    if (existing) return existing;

    const figure = document.createElement("figure") as MermaidFigure;
    figure.className = "org-mermaid";
    figure.dataset.mermaidSource = block.textContent ?? "";
    figure.dataset.mermaidState = "pending";
    figure.setAttribute("aria-busy", "true");

    const canvas = document.createElement("div");
    canvas.className = "org-mermaid-canvas";
    canvas.setAttribute("aria-live", "polite");

    const source = document.createElement("details");
    source.className = "org-mermaid-source";
    source.open = true;
    const summary = document.createElement("summary");
    summary.textContent = "Mermaid diagram source";
    const previews = staticPreviewTemplates(block);

    block.replaceWith(figure);
    source.append(summary, block);
    figure.append(canvas, ...previews, source);
    applyStaticPreview(figure, activeVariant());
    markOnce(preparedMark);
    return figure;
  });

const mermaidTheme = (): Parameters<MermaidApi["initialize"]>[0] => {
  const styles = getComputedStyle(document.documentElement);
  const read = (name: string, fallback: string): string =>
    styles.getPropertyValue(name).trim() || fallback;
  const variant = document.documentElement.dataset.themeVariant ?? "mocha";
  const darkMode = variant !== "latte";
  return {
    startOnLoad: false,
    securityLevel: "strict",
    suppressErrorRendering: true,
    maxTextSize: 50_000,
    maxEdges: 1_000,
    theme: "base",
    darkMode,
    fontFamily: read("--font-body", "Inter, sans-serif"),
    themeVariables: {
      background: read("--surface-canvas", darkMode ? "#1e1e2e" : "#eff1f5"),
      primaryColor: read("--surface-paper", darkMode ? "#313244" : "#e6e9ef"),
      primaryTextColor: read("--face-normal", darkMode ? "#cdd6f4" : "#4c4f69"),
      primaryBorderColor: read("--docs-blue", darkMode ? "#89b4fa" : "#1e66f5"),
      lineColor: read("--docs-overlay", darkMode ? "#6c7086" : "#9ca0b0"),
      secondaryColor: read("--docs-mantle", darkMode ? "#181825" : "#e6e9ef"),
      tertiaryColor: read("--docs-crust", darkMode ? "#11111b" : "#dce0e8"),
    },
  };
};

const initializeMermaid = (mermaid: MermaidApi): void => {
  const theme = mermaidTheme();
  const key = JSON.stringify(theme);
  if (initializedThemes.get(mermaid as object) === key) return;
  mermaid.initialize(theme);
  initializedThemes.set(mermaid as object, key);
};

const renderFigure = async (figure: MermaidFigure, loader: MermaidLoader): Promise<void> => {
  const source = figure.dataset.mermaidSource ?? "";
  const canvas = figure.querySelector<HTMLElement>(".org-mermaid-canvas");
  const sourceDetails = figure.querySelector<HTMLDetailsElement>(".org-mermaid-source");
  if (!canvas || !source.trim()) return;
  figure.dataset.mermaidState = "rendering";
  try {
    const mermaid = await loader();
    initializeMermaid(mermaid);
    const id = `org-zhixing-mermaid-${++diagramSequence}`;
    const { svg, bindFunctions } = await mermaid.render(id, source);
    if (!figure.isConnected) return;
    canvas.innerHTML = svg;
    bindFunctions?.(canvas);
    sourceDetails?.removeAttribute("open");
    figure.dataset.mermaidState = "ready";
    figure.dataset.mermaidVariant = activeVariant();
    figure.removeAttribute("aria-busy");
    markOnce(firstReadyMark);
  } catch (cause) {
    if (!figure.isConnected) return;
    const output = document.createElement("output");
    output.className = "org-mermaid-error";
    output.textContent =
      cause instanceof Error ? cause.message : "Unable to render Mermaid diagram";
    canvas.replaceChildren(output);
    sourceDetails?.setAttribute("open", "");
    figure.dataset.mermaidState = "error";
    figure.removeAttribute("aria-busy");
  }
};

const createRenderQueue = (loader: MermaidLoader) => {
  let active = true;
  let sequence = Promise.resolve();
  const queue = (figure: MermaidFigure): void => {
    const variant = activeVariant();
    if (
      figure.dataset.mermaidState === "rendering" ||
      figure.dataset.mermaidQueued === variant ||
      (figure.dataset.mermaidState === "ready" && figure.dataset.mermaidVariant === variant)
    ) {
      return;
    }
    figure.dataset.mermaidQueued = variant;
    sequence = sequence.then(async () => {
      if (active && figure.isConnected) await renderFigure(figure, loader);
      if (figure.dataset.mermaidQueued === variant) delete figure.dataset.mermaidQueued;
    });
  };
  return {
    queue,
    stop: () => {
      active = false;
    },
  };
};

const scheduleRender = (figure: MermaidFigure, queue: (figure: MermaidFigure) => void): void => {
  const schedule =
    window.requestIdleCallback ??
    ((callback: IdleRequestCallback) => window.setTimeout(callback, 0));
  schedule(() => queue(figure), { timeout: 300 });
};

const isNearViewport = (figure: MermaidFigure): boolean => {
  // Layout-less test DOMs have no reliable viewport position, so retain observer-driven behavior there.
  if (figure.getClientRects().length === 0) return false;
  const bounds = figure.getBoundingClientRect();
  return bounds.bottom >= -240 && bounds.top <= window.innerHeight + 240;
};

const installViewportRendering = (
  figures: MermaidFigure[],
  queue: (figure: MermaidFigure) => void,
): { observe: (figure: MermaidFigure) => void; stop: () => void } => {
  const dynamicFigures = figures.filter((figure) => figure.dataset.mermaidStaticPreview !== "true");
  if (dynamicFigures.length === 0) return { observe: () => undefined, stop: () => undefined };
  if (!("IntersectionObserver" in window)) {
    const observe = (figure: MermaidFigure) => scheduleRender(figure, queue);
    for (const figure of dynamicFigures) observe(figure);
    return { observe, stop: () => undefined };
  }
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const figure = entry.target as MermaidFigure;
        observer.unobserve(figure);
        queue(figure);
      }
    },
    { rootMargin: "240px 0px" },
  );
  const observe = (figure: MermaidFigure) => observer.observe(figure);
  for (const figure of dynamicFigures) {
    if (isNearViewport(figure)) queue(figure);
    else observe(figure);
  }
  return { observe, stop: () => observer.disconnect() };
};

const installThemeRendering = (
  figures: MermaidFigure[],
  queue: (figure: MermaidFigure) => void,
  observe: (figure: MermaidFigure) => void,
): (() => void) => {
  const observer = new MutationObserver(() => {
    for (const figure of figures) {
      if (figure.dataset.mermaidStaticPreview === "true") {
        applyStaticPreview(figure, activeVariant());
        continue;
      }
      if (figure.dataset.mermaidState !== "ready") continue;
      if (isNearViewport(figure)) queue(figure);
      else observe(figure);
    }
  });
  observer.observe(document.documentElement, {
    attributeFilter: ["data-theme-variant"],
    attributes: true,
  });
  return () => observer.disconnect();
};

export const installMermaidDiagrams = (
  root: ParentNode,
  loader: MermaidLoader = loadMermaid,
): (() => void) => {
  const figures = prepareMermaidFigures(root);
  if (figures.length === 0) return () => undefined;

  const renderQueue = createRenderQueue(loader);
  const viewportRendering = installViewportRendering(figures, renderQueue.queue);
  const stopThemeRendering = installThemeRendering(
    figures,
    renderQueue.queue,
    viewportRendering.observe,
  );
  return () => {
    renderQueue.stop();
    viewportRendering.stop();
    stopThemeRendering();
  };
};
