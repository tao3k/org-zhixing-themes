type Highlighter = {
  getLoadedLanguages: () => string[];
  loadLanguage: (...languages: string[]) => Promise<void>;
  codeToHtml: (code: string, options: { lang: string; theme: string }) => string;
};

type CodeBlockRecord = {
  code: string;
  language: string;
};

const records = new WeakMap<HTMLElement, CodeBlockRecord>();
let highlighterPromise: Promise<Highlighter> | null = null;

const languageAliases: Record<string, string> = {
  js: "javascript",
  md: "markdown",
  py: "python",
  sh: "bash",
  shell: "bash",
  tex: "latex",
  ts: "typescript",
  typ: "typst",
  yml: "yaml",
};

const codeTheme = "tokyo-night";

const languageFromBlock = (block: HTMLElement): string | null => {
  const classes = [...block.classList, ...(block.querySelector("code")?.classList ?? [])];
  for (const className of classes) {
    const match = /^(?:src-|language-)([\w+-]+)$/i.exec(className);
    if (!match) continue;
    const declaredLanguage = match[1]?.toLowerCase();
    if (!declaredLanguage || declaredLanguage === "mermaid") continue;
    return languageAliases[declaredLanguage] ?? declaredLanguage;
  }
  return null;
};

export const findOrgCodeBlocks = (root: ParentNode): HTMLElement[] =>
  [...root.querySelectorAll<HTMLElement>("pre")].filter(
    (block) =>
      !block.closest("[data-org-code-highlight]") &&
      !block.classList.contains("src-mermaid") &&
      languageFromBlock(block) !== null,
  );

export const prepareOrgCodeBlocks = (root: ParentNode): HTMLElement[] =>
  findOrgCodeBlocks(root).map((block) => {
    const language = languageFromBlock(block);
    if (!language) return block;
    const figure = document.createElement("figure");
    figure.className = "org-code-highlight";
    figure.dataset.orgCodeHighlight = "pending";
    figure.setAttribute("aria-busy", "true");
    const label = document.createElement("figcaption");
    label.textContent = language;
    block.before(figure);
    figure.append(label, block);
    records.set(figure, {
      code: block.textContent ?? "",
      language,
    });
    return figure;
  });

const loadHighlighter = (): Promise<Highlighter> => {
  highlighterPromise ??= import("shiki").then(
    ({ createHighlighter }) =>
      createHighlighter({
        themes: [codeTheme],
        langs: [],
      }) as Promise<Highlighter>,
  );
  return highlighterPromise;
};

const renderCodeBlock = async (
  figure: HTMLElement,
  load: () => Promise<Highlighter>,
): Promise<void> => {
  const record = records.get(figure);
  if (!record) return;
  const highlighter = await load();
  if (!highlighter.getLoadedLanguages().includes(record.language)) {
    await highlighter.loadLanguage(record.language);
  }
  const markup = highlighter.codeToHtml(record.code, {
    lang: record.language,
    theme: codeTheme,
  });
  const template = document.createElement("template");
  template.innerHTML = markup.trim();
  const highlighted = template.content.firstElementChild;
  const previous = figure.querySelector("pre");
  if (!(highlighted instanceof HTMLElement) || !previous) return;
  highlighted.classList.add("org-code-highlight-pre");
  previous.replaceWith(highlighted);
  figure.dataset.orgCodeHighlight = "ready";
  figure.setAttribute("aria-busy", "false");
};

const installOrgCodeHighlightingPipeline = (
  root: ParentNode,
  load: () => Promise<Highlighter> = loadHighlighter,
): (() => void) => {
  const figures = prepareOrgCodeBlocks(root);
  if (figures.length === 0) return () => undefined;
  const render = (figure: HTMLElement): void => {
    void renderCodeBlock(figure, load).catch(() => {
      figure.dataset.orgCodeHighlight = "fallback";
      figure.setAttribute("aria-busy", "false");
    });
  };
  let visibilityObserver: IntersectionObserver | null = null;
  if ("IntersectionObserver" in window) {
    visibilityObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          visibilityObserver?.unobserve(entry.target);
          render(entry.target as HTMLElement);
        }
      },
      { rootMargin: "240px 0px" },
    );
    for (const figure of figures) visibilityObserver.observe(figure);
  } else {
    for (const figure of figures) render(figure);
  }

  return () => {
    visibilityObserver?.disconnect();
  };
};

export const installOrgCodeHighlighting = (
  root: ParentNode,
  load: () => Promise<Highlighter> = loadHighlighter,
): (() => void) => installOrgCodeHighlightingPipeline(root, load);
