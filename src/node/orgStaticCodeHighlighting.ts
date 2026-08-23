import { Window } from "happy-dom";
import type { LanguageInput } from "@shikijs/types";
import { languageFromOrgCodeClasses } from "../orgCodeLanguage";
import { orgCodeHighlightThemes } from "../orgCodeHighlightTheme";

type Highlighter = {
  loadLanguage: (...languages: LanguageInput[]) => Promise<void>;
  getLoadedLanguages: () => string[];
  codeToHtml: (
    code: string,
    options: { lang: string; themes: typeof orgCodeHighlightThemes },
  ) => string;
};
type LanguageModule = { default: LanguageInput };
type LanguageLoader = () => Promise<LanguageModule>;

const languageLoaders: Readonly<Record<string, LanguageLoader>> = {
  bash: () => import("@shikijs/langs/bash"),
  json: () => import("@shikijs/langs/json"),
  latex: () => import("@shikijs/langs/latex"),
  scheme: () => import("@shikijs/langs/scheme"),
  toml: () => import("@shikijs/langs/toml"),
  typescript: () => import("@shikijs/langs/typescript"),
  typst: () => import("@shikijs/langs/typst"),
  yaml: () => import("@shikijs/langs/yaml"),
};
let highlighterPromise: Promise<Highlighter> | null = null;
const loadedLanguagePromises = new Map<string, Promise<void>>();

const loadHighlighter = (): Promise<Highlighter> => {
  highlighterPromise ??= Promise.all([
    import("shiki/core"),
    import("shiki/engine/javascript"),
    import("@shikijs/themes/github-dark"),
    import("@shikijs/themes/github-light"),
  ]).then(
    ([
      { createHighlighterCore },
      { createJavaScriptRegexEngine },
      { default: darkTheme },
      { default: lightTheme },
    ]) =>
      createHighlighterCore({
        themes: [darkTheme, lightTheme],
        langs: [],
        engine: createJavaScriptRegexEngine(),
      }) as Promise<Highlighter>,
  );
  return highlighterPromise;
};

const ensureLanguage = async (highlighter: Highlighter, language: string): Promise<boolean> => {
  const loader = languageLoaders[language];
  if (!loader) return false;
  if (highlighter.getLoadedLanguages().includes(language)) return true;
  const loading =
    loadedLanguagePromises.get(language) ??
    loader().then(({ default: grammar }) => highlighter.loadLanguage(grammar));
  loadedLanguagePromises.set(language, loading);
  await loading;
  return true;
};

const blockLanguage = (block: HTMLPreElement): string | null =>
  languageFromOrgCodeClasses([
    ...block.classList,
    ...(block.querySelector("code")?.classList ?? []),
  ]);

export const highlightOrgStaticDocument = async (document: Document): Promise<void> => {
  const blocks = [...(document.querySelectorAll("pre") as unknown as HTMLPreElement[])].filter(
    (block) =>
      !block.closest("[data-org-code-highlight]") && !block.classList.contains("src-mermaid"),
  );
  const highlighter = blocks.length > 0 ? await loadHighlighter() : null;
  if (!highlighter) return;

  for (const block of blocks) {
    const language = blockLanguage(block);
    if (!language || !(await ensureLanguage(highlighter, language))) continue;
    const figure = document.createElement("figure");
    figure.className = "org-code-highlight";
    figure.dataset.orgCodeHighlight = "ready";
    const caption = document.createElement("figcaption");
    caption.textContent = language;
    const template = document.createElement("template");
    template.innerHTML = highlighter.codeToHtml(block.textContent ?? "", {
      lang: language,
      themes: orgCodeHighlightThemes,
    });
    const pre = template.content.firstElementChild;
    if (!pre) continue;
    pre.classList.add("org-code-highlight-pre");
    figure.append(caption, pre);
    const parent = block.parentElement;
    if (parent?.tagName === "P" && parent.children.length === 1) {
      parent.replaceWith(figure);
    } else {
      block.replaceWith(figure);
    }
  }
};

export const highlightOrgStaticHtml = async (html: string): Promise<string> => {
  const window = new Window();
  window.document.body.innerHTML = html;
  await highlightOrgStaticDocument(window.document as unknown as Document);
  return window.document.body.innerHTML;
};
