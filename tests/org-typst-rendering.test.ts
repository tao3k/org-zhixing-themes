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

  it("renders the preview by default and toggles the source inside one block", async () => {
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
    const source = document.querySelector<HTMLElement>("pre.src-typst");
    const toggle = document.querySelector<HTMLButtonElement>(".org-typst-view-toggle");
    expect(source?.hidden).toBe(true);
    expect(toggle?.textContent).toBe("Source code");

    toggle?.click();
    expect(source?.hidden).toBe(false);
    expect(document.querySelector<HTMLElement>(".org-typst-preview")?.hidden).toBe(true);
    expect(toggle?.textContent).toBe("Preview");
    expect(toggle?.getAttribute("aria-pressed")).toBe("true");

    toggle?.click();
    expect(source?.hidden).toBe(true);
    expect(document.querySelector<HTMLElement>(".org-typst-preview")?.hidden).toBe(false);
    stop();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:typst-preview");
    expect(source?.hidden).toBe(false);
    expect(document.querySelector(".org-typst-block")).toBeNull();
  });

  it("surfaces an error when compilation fails", async () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    document.body.innerHTML = `<pre class="src src-typst">broken(</pre>`;
    installOrgTypstRendering(document, async () => {
      throw new Error("invalid Typst");
    });

    await vi.waitFor(() =>
      expect(document.querySelector<HTMLElement>(".org-typst-preview")?.dataset.orgTypstState).toBe(
        "error",
      ),
    );
    expect(document.querySelector(".org-typst-preview-error")?.textContent).toBe("invalid Typst");
    expect(document.querySelector(".src-typst")?.textContent).toBe("broken(");
    expect(consoleError).toHaveBeenCalledOnce();
  });
});
