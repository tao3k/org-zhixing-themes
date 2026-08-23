import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const renderedOrgCss = readFileSync(resolve(process.cwd(), "src/styles/rendered-org.css"), "utf8");
const documentsCss = readFileSync(resolve(process.cwd(), "themes/documents/src/theme.css"), "utf8");

describe("Org semantic theme tokens", () => {
  it("derives semantic UI from theme primitives instead of a fixed palette", () => {
    expect(renderedOrgCss).toContain("--org-semantic-accent-fg: var(--face-salient);");
    expect(renderedOrgCss).toContain("--org-semantic-neutral-surface: color-mix(");
    expect(renderedOrgCss).toContain("var(--org-semantic-attention-fg)");
    expect(renderedOrgCss).toContain("var(--org-semantic-complete-surface)");
    expect(renderedOrgCss).not.toMatch(
      /\.org-heading-todo--todo\s*\{[^}]*--amber-6/s,
    );
    expect(renderedOrgCss).not.toMatch(/\.org-meta-tag\s*\{[^}]*--blue-6/s);
  });

  it("lets Documents provide its own variant-aware semantic palette", () => {
    expect(documentsCss).toContain("--org-semantic-attention-fg: var(--docs-yellow);");
    expect(documentsCss).toContain("--org-semantic-complete-fg: var(--docs-green);");
    expect(documentsCss).toContain("--org-semantic-critical-fg: var(--docs-red);");
    expect(documentsCss).not.toMatch(
      /\.org-heading-todo--todo\s*\{[^}]*var\(--docs-yellow\)/s,
    );
  });
});
