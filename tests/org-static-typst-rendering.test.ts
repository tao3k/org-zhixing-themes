import { describe, expect, it, vi } from "vitest";

import { renderOrgStaticTypstHtml } from "../src/node/orgStaticTypstRendering";

describe("static Org Typst rendering", () => {
  it("precompiles highlighted Typst into a theme-inheriting template", async () => {
    const render = vi.fn(
      async (source: string) => `<svg><path fill="#000" data-source="${source}" /></svg>`,
    );

    const html = await renderOrgStaticTypstHtml(
      '<figure class="org-code-highlight"><figcaption>typst</figcaption><pre><code>= Static</code></pre></figure>',
      render,
    );

    expect(render).toHaveBeenCalledWith("= Static");
    expect(html).toContain('template data-org-typst-static-preview="ready"');
    expect(html).toContain('fill="currentColor"');
  });

  it("preserves real compiler artwork inside the serialized static template", async () => {
    const html = await renderOrgStaticTypstHtml(
      '<figure class="org-code-highlight"><figcaption>typst</figcaption><pre><code>$ integral_0^1 x dif x $</code></pre></figure>',
    );

    expect(html).toContain('template data-org-typst-static-preview="ready"');
    expect(html).toMatch(/<(?:path|use)\b/);
  });

  it("rejects an empty SVG instead of publishing a false ready state", async () => {
    await expect(
      renderOrgStaticTypstHtml(
        '<figure class="org-code-highlight"><figcaption>typst</figcaption><pre><code>= Empty</code></pre></figure>',
        async () => '<svg viewBox="0 0 10 10"></svg>',
      ),
    ).rejects.toThrow("Static Typst renderer emitted an empty SVG");
  });

  it("leaves non-Typst source blocks untouched", async () => {
    const render = vi.fn(async () => "<svg />");
    const html = await renderOrgStaticTypstHtml(
      '<pre class="src src-typescript">const x = 1;</pre>',
      render,
    );

    expect(render).not.toHaveBeenCalled();
    expect(html).not.toContain("data-org-typst-static-preview");
  });
});
