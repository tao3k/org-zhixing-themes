import { describe, expect, it, vi } from "vitest";

import {
  renderOrgStaticMermaidDocument,
  staticMermaidVariants,
} from "../src/node/orgStaticMermaidRendering";

describe("static Org Mermaid rendering", () => {
  it("emits one precompiled template per built-in theme", async () => {
    document.body.innerHTML = '<pre class="src src-mermaid">flowchart TD; A --&gt; B</pre>';
    const render = vi.fn(
      async (_source: string, variant: string) =>
        `<svg data-preview="${variant}"><g><path d="M0 0L1 1" /></g></svg>`,
    );

    await renderOrgStaticMermaidDocument(document, render);

    expect(render).toHaveBeenCalledTimes(staticMermaidVariants.length);
    for (const variant of staticMermaidVariants) {
      expect(
        document.querySelector(`template[data-org-mermaid-static-preview="${variant}"]`),
      ).not.toBeNull();
    }
  });

  it("does not duplicate an already precompiled source block", async () => {
    document.body.innerHTML = `
      <template data-org-mermaid-static-preview="mocha"><svg /></template>
      <pre class="src src-mermaid">flowchart TD; A --&gt; B</pre>
    `;
    const render = vi.fn(async () => "<svg />");

    await renderOrgStaticMermaidDocument(document, render);

    expect(render).not.toHaveBeenCalled();
  });

  it("preserves generated SVG graphics through static HTML serialization", async () => {
    document.body.innerHTML = '<pre class="src src-mermaid">flowchart TD; A --&gt; B</pre>';
    const render = vi.fn(
      async () =>
        '<svg xmlns="http://www.w3.org/2000/svg"><style>.node{fill:red}</style><g class="node"><path d="M0 0L1 1" /></g></svg>',
    );

    await renderOrgStaticMermaidDocument(document, render);

    const serialized = document.body.innerHTML;
    expect(serialized).toContain('<g class="node">');
    expect(serialized).toContain('<path d="M0 0L1 1"');
  });

  it("rejects an empty SVG instead of publishing a blank diagram", async () => {
    document.body.innerHTML = '<pre class="src src-mermaid">flowchart TD; A --&gt; B</pre>';

    await expect(renderOrgStaticMermaidDocument(document, async () => "<svg />")).rejects.toThrow(
      "Static Mermaid renderer emitted an empty SVG",
    );
  });
});
