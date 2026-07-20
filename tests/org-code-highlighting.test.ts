import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import {
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
