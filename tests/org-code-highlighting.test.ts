import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import {
  configureOrgCodeLanguage,
  findOrgCodeBlocks,
  installOrgCodeHighlighting,
  prepareOrgCodeBlocks,
} from "../src/react/orgCodeHighlighting";

afterEach(() => {
  document.body.replaceChildren();
  vi.unstubAllGlobals();
});

describe("Org Babel syntax highlighting", () => {
  it("recognizes Org and ecosystem language classes without consuming Mermaid", () => {
    document.body.innerHTML = `
      <pre class="src src-typescript">const value: number = 1</pre>
      <pre><code class="language-python">value = 1</code></pre>
      <pre class="src src-mermaid">flowchart LR; A --&gt; B</pre>
    `;

    expect(findOrgCodeBlocks(document)).toHaveLength(2);
    expect(prepareOrgCodeBlocks(document)).toHaveLength(2);
    expect(document.querySelectorAll("figure.org-code-highlight")).toHaveLength(2);
    expect(document.body.textContent).toContain("const value: number = 1");
  });

  it("lazy-renders highlighted markup while preserving the theme-owned frame", async () => {
    class VisibleObserver {
      readonly callback: IntersectionObserverCallback;
      constructor(callback: IntersectionObserverCallback) {
        this.callback = callback;
      }
      observe(target: Element): void {
        this.callback(
          [{ isIntersecting: true, target } as IntersectionObserverEntry],
          this as never,
        );
      }
      disconnect(): void {}
      unobserve(): void {}
    }
    vi.stubGlobal("IntersectionObserver", VisibleObserver);
    document.documentElement.dataset.themeVariant = "mocha";
    document.body.innerHTML = `<pre class="src src-typescript">const answer = 42</pre>`;
    const codeToHtml = vi.fn(
      () =>
        '<pre style="background:#1e1e2e"><code><span style="color:#cba6f7">const</span> answer = 42</code></pre>',
    );
    const loadLanguage = vi.fn(async () => undefined);

    const stop = installOrgCodeHighlighting(document, async () => ({
      codeToHtml,
      getLoadedLanguages: () => [],
      loadLanguage,
    }));
    await vi.waitFor(() =>
      expect(document.querySelector("figure")?.dataset.orgCodeHighlight).toBe("ready"),
    );

    expect(loadLanguage).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ name: "typescript" })]),
    );
    expect(codeToHtml).toHaveBeenCalledWith(
      "const answer = 42",
      expect.objectContaining({
        lang: "typescript",
        theme: "tokyo-night",
      }),
    );
    expect(document.querySelector(".org-code-highlight-pre")).not.toBeNull();
    stop();
  });

  it("normalizes Scheme-family language aliases to the Scheme loader", async () => {
    class VisibleObserver {
      readonly callback: IntersectionObserverCallback;

      constructor(callback: IntersectionObserverCallback) {
        this.callback = callback;
      }

      observe(target: Element): void {
        this.callback(
          [{ isIntersecting: true, target } as IntersectionObserverEntry],
          this as never,
        );
      }

      disconnect(): void {}
      unobserve(): void {}
    }

    vi.stubGlobal("IntersectionObserver", VisibleObserver);
    document.body.innerHTML = ["scheme", "gerbil", "racket", "lisp"]
      .map((language) => `<pre class="src src-${language}">(define (identity value) value)</pre>`)
      .join("");

    const languageLoader = vi.fn(async () => ({ id: "scheme" }) as never);
    const disposeLanguage = configureOrgCodeLanguage("scheme", languageLoader);
    const codeToHtml = vi.fn(
      (_code: string, _options: { lang: string; theme: string }) =>
        "<pre><code><span>define</span></code></pre>",
    );
    const stop = installOrgCodeHighlighting(document, async () => ({
      codeToHtml,
      getLoadedLanguages: () => [],
      loadLanguage: vi.fn(async () => undefined),
    }));

    try {
      await vi.waitFor(() =>
        expect(
          [...document.querySelectorAll<HTMLElement>("figure[data-org-code-highlight]")].map(
            (figure) => figure.dataset.orgCodeHighlight,
          ),
        ).toEqual(["ready", "ready", "ready", "ready"]),
      );

      expect(languageLoader).toHaveBeenCalledTimes(4);
      expect(codeToHtml).toHaveBeenCalledTimes(4);
      for (const [, options] of codeToHtml.mock.calls) {
        expect(options).toEqual(expect.objectContaining({ lang: "scheme", theme: "tokyo-night" }));
      }
    } finally {
      stop();
      disposeLanguage();
    }
  });

  it("renders Scheme with the real Shiki grammar", async () => {
    class VisibleObserver {
      readonly callback: IntersectionObserverCallback;

      constructor(callback: IntersectionObserverCallback) {
        this.callback = callback;
      }

      observe(target: Element): void {
        this.callback(
          [{ isIntersecting: true, target } as IntersectionObserverEntry],
          this as never,
        );
      }

      disconnect(): void {}
      unobserve(): void {}
    }

    vi.stubGlobal("IntersectionObserver", VisibleObserver);
    document.body.innerHTML =
      '<pre class="src src-scheme">(define (square value) (* value value))</pre>';
    const stop = installOrgCodeHighlighting(document);

    try {
      await vi.waitFor(
        () =>
          expect(
            document.querySelector<HTMLElement>("figure[data-org-code-highlight]")?.dataset
              .orgCodeHighlight,
          ).toBe("ready"),
        { timeout: 10_000 },
      );

      expect(document.querySelector("pre.shiki")).not.toBeNull();
      expect(document.querySelectorAll("pre.shiki code span").length).toBeGreaterThan(0);
    } finally {
      stop();
    }
  });

  it("accepts Shiki languages beyond a handwritten allow-list", () => {
    document.body.innerHTML = `
      <pre class="src src-julia">answer = 42</pre>
      <pre class="src src-zig">const answer: u8 = 42;</pre>
      <pre class="src src-latex">\\frac{a}{b}</pre>
      <pre><code class="language-typ">$ integral_0^1 x dif x $</code></pre>
      <pre class="src src-mermaid">flowchart LR; A --&gt; B</pre>
    `;

    const figures = prepareOrgCodeBlocks(document);

    expect(figures).toHaveLength(4);
    expect(figures.map((figure) => figure.textContent)).toEqual([
      "juliaanswer = 42",
      "zigconst answer: u8 = 42;",
      "latex\\frac{a}{b}",
      "typst$ integral_0^1 x dif x $",
    ]);
  });

  it("forces code-line and token backgrounds to remain theme-transparent", () => {
    const css = readFileSync("themes/documents/src/theme.css", "utf8");

    expect(css).toContain(".documents-document-body pre code .line");
    expect(css).toContain(".documents-document-body pre code span");
    expect(css).toContain("background: transparent !important");
    expect(css).toContain("background: var(--docs-crust) !important");
  });
});
