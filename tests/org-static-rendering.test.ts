import { describe, expect, it, vi } from "vitest";

import { renderOrgStaticHtml } from "../src/node/orgStaticRendering";

describe("static Org rendering pipeline", () => {
  it("enhances one document without serializing DOM nodes through escaped HTML", async () => {
    const renderMermaid = vi.fn(
      async (_source: string, variant: string) =>
        `<svg data-preview="${variant}"><g><path d="M0 0L1 1" /></g></svg>`,
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
    expect(html).toContain('<path d="M0 0L1 1"');
    expect(renderMermaid).toHaveBeenCalledTimes(4);
  });

  it("preserves Mermaid HTML inside foreignObject", async () => {
    const html = await renderOrgStaticHtml('<pre class="src src-mermaid">flowchart TD</pre>', {
      currentFile: "notes.org",
      mermaidRenderer: async () =>
        '<svg><foreignObject><div xmlns="http://www.w3.org/1999/xhtml">one<br>two</div></foreignObject></svg>',
      sources: [{ file: "notes.org", id: "notes" }],
    });

    expect(html).toContain("<foreignObject>");
    expect(html).toContain("<br>");
    expect(html).not.toContain("parsererror");
  });
});
