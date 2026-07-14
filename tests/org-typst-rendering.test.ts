import { afterEach, describe, expect, it, vi } from "vitest";
import { findOrgTypstBlocks, installOrgTypstRendering } from "../src/react/orgTypstRendering";

afterEach(() => {
  document.body.replaceChildren();
  vi.unstubAllGlobals();
});

describe("Org Typst rendering", () => {
  it("recognizes Typst and typ aliases", () => {
    document.body.innerHTML = `
      <pre class="src src-typst">= Document</pre>
      <pre><code class="language-typ">$ integral_0^1 x dif x $</code></pre>
    `;
    expect(findOrgTypstBlocks(document)).toHaveLength(2);
  });

  it("renders a lazy SVG preview without replacing the readable source", async () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    const createObjectURL = vi.fn(() => "blob:typst-preview");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });
    document.body.innerHTML = `<pre class="src src-typst">= Fast Typst</pre>`;
    const render = vi.fn(async () => '<svg viewBox="0 0 10 10"></svg>');

    const stop = installOrgTypstRendering(document, render);
    await vi.waitFor(() =>
      expect(document.querySelector<HTMLElement>(".org-typst-preview")?.dataset.orgTypstState).toBe(
        "ready",
      ),
    );

    expect(render).toHaveBeenCalledWith("= Fast Typst");
    expect(document.querySelector("pre")?.textContent).toBe("= Fast Typst");
    expect(document.querySelector(".org-typst-preview img")?.getAttribute("src")).toBe(
      "blob:typst-preview",
    );
    stop();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:typst-preview");
  });

  it("falls back to source when compilation fails", async () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    document.body.innerHTML = `<pre class="src src-typst">broken(</pre>`;
    installOrgTypstRendering(document, async () => {
      throw new Error("invalid Typst");
    });

    await vi.waitFor(() =>
      expect(document.querySelector<HTMLElement>(".org-typst-preview")?.dataset.orgTypstState).toBe(
        "fallback",
      ),
    );
    expect(document.querySelector("pre")?.textContent).toBe("broken(");
  });
});
