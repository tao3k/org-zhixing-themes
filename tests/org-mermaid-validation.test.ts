import { describe, expect, it, vi } from "vitest";

import {
  extractOrgMermaidBlocks,
  formatOrgMermaidDiagnostic,
  validateOrgMermaidBlocks,
} from "../src/node/orgMermaidValidation";

describe("Org Mermaid validation", () => {
  it("extracts case-insensitive Mermaid blocks with arguments and source lines", () => {
    const blocks = extractOrgMermaidBlocks(
      [
        "#+title: Demo",
        "",
        "#+BEGIN_SRC Mermaid :exports results",
        "flowchart LR",
        "  A --> B",
        "#+END_SRC",
      ].join("\n"),
      "docs/demo.org",
    );

    expect(blocks).toEqual([
      {
        block: 1,
        file: "docs/demo.org",
        line: 4,
        source: "flowchart LR\n  A --> B",
        terminated: true,
      },
    ]);
  });

  it("aggregates parse and unterminated-block diagnostics with agent-readable locations", async () => {
    const blocks = extractOrgMermaidBlocks(
      [
        "#+begin_src mermaid",
        "flowchart LR",
        "  A -->",
        "#+end_src",
        "#+begin_src mermaid",
        "sequenceDiagram",
      ].join("\n"),
      "docs/broken.org",
    );
    const parse = vi.fn(async (source: string) => {
      if (source.includes("A -->")) throw new Error("Parse error on line 2: unexpected EOF");
    });

    const diagnostics = await validateOrgMermaidBlocks(blocks, parse);

    expect(diagnostics).toEqual([
      {
        code: "MERMAID-E001",
        file: "docs/broken.org",
        block: 1,
        line: 3,
        message: "Parse error on line 2: unexpected EOF",
      },
      {
        code: "MERMAID-E002",
        file: "docs/broken.org",
        block: 2,
        line: 6,
        message: "Mermaid Org source block is missing #+end_src",
      },
    ]);
    expect(formatOrgMermaidDiagnostic(diagnostics[0])).toBe(
      "MERMAID-E001 docs/broken.org:3 block=1 Parse error on line 2: unexpected EOF",
    );
  });
});
