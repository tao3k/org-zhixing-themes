import { describe, expect, it } from "vitest";

import { inspectStaticMediaHtml } from "../src/node/orgStaticMediaCheck";

describe("serialized Org static media check", () => {
  it("accepts four non-empty Mermaid variants and one non-empty Typst preview", () => {
    const html = `
      ${["latte", "frappe", "macchiato", "mocha"]
        .map(
          (variant) =>
            `<template data-org-mermaid-static-preview="${variant}"><svg><g><path d="M0 0L1 1"></path></g></svg></template>`,
        )
        .join("")}
      <pre class="src src-mermaid">flowchart LR; A --&gt; B</pre>
      <template data-org-typst-static-preview="ready"><svg><path d="M0 0L1 1"></path></svg></template>
      <pre class="src src-typst">$ x = 1 $</pre>
    `;

    expect(inspectStaticMediaHtml(html)).toEqual({
      findings: [],
      mermaidBlocks: 1,
      previews: 5,
      typstBlocks: 1,
    });
  });

  it("reports a blank Mermaid SVG and a missing Typst preview as build failures", () => {
    const html = `
      <template data-org-mermaid-static-preview="mocha"><svg><style></style></svg></template>
      <pre class="src src-mermaid">flowchart LR; A --&gt; B</pre>
      <pre class="src src-typst">$ x = 1 $</pre>
    `;

    const result = inspectStaticMediaHtml(html);
    expect(result.findings).toHaveLength(5);
    expect(result.findings.map((finding) => finding.code)).toEqual([
      "RENDER-MERMAID-E001",
      "RENDER-MERMAID-E001",
      "RENDER-MERMAID-E001",
      "RENDER-MERMAID-E001",
      "RENDER-TYPST-E001",
    ]);
    expect(result.previews).toBe(0);
  });
});
