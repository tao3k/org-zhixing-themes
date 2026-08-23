import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string): string => readFileSync(path, "utf8");

describe("theme-owned Zen layouts", () => {
  it("exposes a stable reader-layout slot to every bundled theme", () => {
    for (const path of [
      "themes/documents/src/index.ts",
      "themes/elegant-blog/src/foundation.ts",
      "themes/minimal-notes/src/index.ts",
    ]) {
      const theme = read(path);
      expect(theme).toContain('id: "reader-layout"');
      expect(theme).toContain('"reader-layout":');
    }
  });

  it("keeps Zen width and composition in theme CSS, not the shared foundation", () => {
    const foundation = read("src/styles/foundation.css");
    expect(foundation).not.toContain('#app[data-reader-mode="zen"] .viewer-pane');

    expect(read("themes/documents/src/theme.css")).toContain(
      ".theme-surface--documents.shell--zen .documents-reader",
    );
    expect(read("themes/elegant-blog/src/theme.css")).toContain(
      '.elegant-blog-reader-layout[data-reader-mode="zen"]',
    );
    expect(read("themes/minimal-notes/src/theme.css")).toContain(
      '.minimal-notes-reader-layout[data-reader-mode="zen"]',
    );
  });
});
