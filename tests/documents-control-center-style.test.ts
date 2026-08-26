import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const documentsThemeCss = readFileSync(
  resolve(process.cwd(), "themes/documents/src/theme.css"),
  "utf8",
);

describe("Documents reading controls", () => {
  it("keeps the reading controls inside the lower sidebar dock", () => {
    expect(documentsThemeCss).toContain(".documents-workspace-dock {");
    expect(documentsThemeCss).toContain("margin-top: auto;");
    expect(documentsThemeCss).toContain("padding: 7px 14px 10px;");
    expect(documentsThemeCss).not.toContain(
      ':root[data-theme="documents"] body .documents-control-center',
    );
    expect(documentsThemeCss).toMatch(/\.documents-control-trigger\s*\{[^}]*border-radius: 0;/s);
  });

  it("keeps its popup constrained to the sidebar and themed by Documents tokens", () => {
    expect(documentsThemeCss).toContain("bottom: calc(100% + 8px);");
    expect(documentsThemeCss).toContain("width: 100%;");
    expect(documentsThemeCss).toContain(
      "background: color-mix(in srgb, var(--surface-canvas) 94%, transparent);",
    );
    expect(documentsThemeCss).toContain("border-color: var(--docs-blue);");
  });
});
