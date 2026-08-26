import { describe, expect, it, vi } from "vitest";

import { renderOrgStaticHtml } from "../src/node/orgStaticRendering";

describe("static Org rendering pipeline", () => {
  it("enhances one document without serializing DOM nodes through escaped HTML", async () => {
    const renderMermaid = vi.fn(
      async (_source: string, variant: string) => `<svg data-preview="${variant}" />`,
    );

    const html = await renderOrgStaticHtml(
      `
        <p><pre class="src src-typescript">const answer: number = 42;</pre></p>
        <pre class="src src-mermaid">flowchart TD; A --&gt; B</pre>
      `,
      {
        currentFile: "notes.org",
        mermaidRenderer: renderMermaid,
        sources: [{ file: "notes.org", id: "notes" }],
      },
    );

    expect(html).toContain('figure class="org-code-highlight"');
    expect(html).not.toContain("&lt;figure");
    expect(html).toContain('template data-org-mermaid-static-preview="mocha"');
    expect(renderMermaid).toHaveBeenCalledTimes(4);
  });
});
