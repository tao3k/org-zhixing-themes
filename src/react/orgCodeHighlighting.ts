import type { LanguageInput } from "@shikijs/types";

type Highlighter = {
  getLoadedLanguages: () => string[];
  loadLanguage: (...languages: LanguageInput[]) => Promise<void>;
  codeToHtml: (code: string, options: { lang: string; theme: string }) => string;
};

type LanguageModule = { default: LanguageInput };

export type OrgCodeLanguageLoader = () => Promise<LanguageModule>;

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

const builtinLanguageLoaders: Readonly<Record<string, OrgCodeLanguageLoader>> = {
  bash: () => import("@shikijs/langs/bash"),
  json: () => import("@shikijs/langs/json"),
  latex: () => import("@shikijs/langs/latex"),
  scheme: () => import("@shikijs/langs/scheme"),
  toml: () => import("@shikijs/langs/toml"),
  typescript: () => import("@shikijs/langs/typescript"),
  typst: () => import("@shikijs/langs/typst"),
  yaml: () => import("@shikijs/langs/yaml"),
};

const languageLoaders = new Map(Object.entries(builtinLanguageLoaders));

export const configureOrgCodeLanguage = (
  language: string,
  loader: OrgCodeLanguageLoader,
): (() => void) => {
  const canonicalLanguage = languageAliases[language.toLowerCase()] ?? language.toLowerCase();
  const previous = languageLoaders.get(canonicalLanguage);
  languageLoaders.set(canonicalLanguage, loader);
  return () => {
    if (previous) languageLoaders.set(canonicalLanguage, previous);
    else languageLoaders.delete(canonicalLanguage);
  };
};

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
  highlighterPromise ??= Promise.all([
    import("shiki/core"),
    import("shiki/engine/javascript"),
    import("@shikijs/themes/tokyo-night"),
  ]).then(
    ([{ createHighlighterCore }, { createJavaScriptRegexEngine }, { default: theme }]) =>
      createHighlighterCore({
        themes: [theme],
        langs: [],
        engine: createJavaScriptRegexEngine(),
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
    const languageLoader = languageLoaders.get(record.language);
    if (!languageLoader) {
      figure.dataset.orgCodeHighlight = "unsupported";
      figure.setAttribute("aria-busy", "false");
      return;
    }
    const { default: language } = await languageLoader();
    await highlighter.loadLanguage(language);
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
