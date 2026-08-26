import { describe, expect, it, vi } from "vitest";

import {
  renderOrgStaticMermaidDocument,
  staticMermaidVariants,
} from "../src/node/orgStaticMermaidRendering";

describe("static Org Mermaid rendering", () => {
  it("emits one precompiled template per built-in theme", async () => {
    document.body.innerHTML = '<pre class="src src-mermaid">flowchart TD; A --&gt; B</pre>';
    const render = vi.fn(
      async (_source: string, variant: string) => `<svg data-preview="${variant}" />`,
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
});
