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
