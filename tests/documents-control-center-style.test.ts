import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const documentsThemeCss = readFileSync(
  resolve(process.cwd(), "themes/documents/src/theme.css"),
  "utf8",
);

describe("Documents reading controls", () => {
  it("keeps the appearance launcher at the viewport edge", () => {
    expect(documentsThemeCss).toContain(
      ':root[data-theme="documents"] body .documents-control-center',
    );
    expect(documentsThemeCss).toContain("position: fixed;");
    expect(documentsThemeCss).toContain("bottom: 1.5rem;");
    expect(documentsThemeCss).toContain("right: 1.5rem;");
    expect(documentsThemeCss).toContain("width: 3rem;");
    expect(documentsThemeCss).toContain("height: 3rem;");
  });

  it("uses the active Documents variant for the launcher and panel", () => {
    expect(documentsThemeCss).toContain('content: "☾";');
    expect(documentsThemeCss).toContain(
      ':root[data-theme="documents"][data-theme-variant="latte"] body .documents-control-trigger > span::before',
    );
    expect(documentsThemeCss).toContain('content: "☀";');
    expect(documentsThemeCss).toContain("background: var(--docs-mantle);");
    expect(documentsThemeCss).toContain("bottom: calc(100% + 0.75rem);");
  });
});
