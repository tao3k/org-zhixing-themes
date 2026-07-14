import type { KatexOptions } from "katex";
import type renderMathInElement from "katex/contrib/auto-render";

type MathRenderer = typeof renderMathInElement;
type MathRendererLoader = () => Promise<MathRenderer>;

const latexSourceSelector = [
  "pre.src-latex",
  "pre > code.language-latex",
  "pre.language-latex",
  'pre[data-language="latex"]',
  '[data-org-language="latex"] pre',
].join(", ");

const mathDelimiterPattern = /(?:\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\$[^$\n]+?\$)/;

const autoRenderOptions: Parameters<MathRenderer>[1] = {
  delimiters: [
    { left: "$$", right: "$$", display: true },
    { left: "\\[", right: "\\]", display: true },
    { left: "\\(", right: "\\)", display: false },
    { left: "$", right: "$", display: false },
  ],
  ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code"],
  output: "htmlAndMathml",
  strict: "warn",
  throwOnError: false,
  trust: false,
};

const displayOptions: KatexOptions = {
  displayMode: true,
  output: "htmlAndMathml",
  strict: "warn",
  throwOnError: true,
};

const containsDelimitedMath = (root: ParentNode): boolean => {
  const probe = root.cloneNode(true) as ParentNode;
  probe
    .querySelectorAll("pre, code, script, style, textarea")
    .forEach((element) => element.remove());
  return mathDelimiterPattern.test(probe.textContent ?? "");
};

export const containsOrgMath = (root: ParentNode): boolean =>
  root.querySelector(latexSourceSelector) !== null || containsDelimitedMath(root);

const renderLatexSourceBlocks = async (root: ParentNode): Promise<void> => {
  const sourceBlocks = Array.from(root.querySelectorAll<HTMLElement>(latexSourceSelector))
    .map((element) => {
      const pre = element.matches("pre") ? element : element.closest<HTMLElement>("pre");
      return { pre, source: element.textContent?.trim() ?? "" };
    })
    .filter(
      (entry): entry is { pre: HTMLElement; source: string } =>
        entry.pre !== null &&
        entry.source.length > 0 &&
        entry.pre.dataset.orgLatexRendered !== "true",
    );

  if (sourceBlocks.length === 0) {
    return;
  }

  const { default: katex } = await import("katex");

  for (const { pre, source } of sourceBlocks) {
    const preview = document.createElement("div");
    preview.className = "org-latex-preview";
    preview.dataset.orgLatexRendered = "true";

    try {
      preview.innerHTML = katex.renderToString(source, displayOptions);
      pre.replaceWith(preview);
    } catch (error) {
      pre.dataset.orgLatexError = error instanceof Error ? error.message : String(error);
    }
  }
};

const loadMathRenderer: MathRendererLoader = async () =>
  (await import("katex/contrib/auto-render")).default;

export const installOrgMathRendering = (
  root: HTMLElement,
  loadRenderer: MathRendererLoader = loadMathRenderer,
): (() => void) => {
  let cancelled = false;
  root.dataset.orgMathState = "loading";

  void Promise.all([loadRenderer(), renderLatexSourceBlocks(root)])
    .then(([renderMath]) => {
      if (cancelled) {
        return;
      }
      renderMath(root, autoRenderOptions);
      root.dataset.orgMathState = "ready";
    })
    .catch(() => {
      if (!cancelled) {
        root.dataset.orgMathState = "fallback";
      }
    });

  return () => {
    cancelled = true;
  };
};

export const renderOrgMath = async (root: HTMLElement): Promise<void> => {
  const renderMath = await loadMathRenderer();
  await renderLatexSourceBlocks(root);
  renderMath(root, autoRenderOptions);
};
