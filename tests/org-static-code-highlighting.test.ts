import { describe, expect, it } from "vitest";
import { highlightOrgStaticHtml } from "../src/node/orgStaticCodeHighlighting";
import { orgCodeHighlightThemes } from "../src/orgCodeHighlightTheme";

describe("static Org code highlighting", () => {
  it("highlights TypeScript and Scheme while preserving Mermaid and unsupported blocks", async () => {
    const output = await highlightOrgStaticHtml(`
      <pre class="src src-typescript">const answer: number = 42;</pre>
      <pre class="src src-scheme" data-poo-flow="browser-profile">(display "hello")</pre>
      <pre class="src src-mermaid">flowchart LR; A --&gt; B</pre>
      <pre class="src src-unsupported">raw fallback</pre>
    `);

    expect(output).toContain('class="org-code-highlight" data-org-code-highlight="ready"');
    expect(output).toContain(
      `class="shiki shiki-themes ${orgCodeHighlightThemes.light} ${orgCodeHighlightThemes.dark}`,
    );
    expect(output).toContain("--shiki-dark-bg");
    expect(output).toContain("const");
    expect(output).toContain("display");
    expect(output).toContain(
      'class="org-code-highlight" data-org-code-highlight="ready" data-poo-flow="browser-profile"',
    );
    expect(output).toContain("org-code-highlight-pre src src-scheme");
    expect(output).toContain('class="src src-mermaid"');
    expect(output).toContain('class="src src-unsupported"');
    expect(output).not.toContain("Theme preview");
  });
});
