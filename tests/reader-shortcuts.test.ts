import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { isEditableKeyboardTarget, isZenModeShortcut } from "../src/react/readerShortcuts";

describe("reader keyboard shortcuts", () => {
  it("reserves Ctrl+Z for Zen without claiming Command+Z or Alt+Z", () => {
    expect(
      isZenModeShortcut({
        altKey: false,
        ctrlKey: true,
        key: "z",
        metaKey: false,
      }),
    ).toBe(true);
    expect(
      isZenModeShortcut({
        altKey: false,
        ctrlKey: false,
        key: "z",
        metaKey: true,
      }),
    ).toBe(false);
    expect(
      isZenModeShortcut({
        altKey: true,
        ctrlKey: true,
        key: "z",
        metaKey: false,
      }),
    ).toBe(false);
  });

  it("does not steal undo from editable controls", () => {
    expect(isEditableKeyboardTarget(document.createElement("input"))).toBe(true);
    expect(isEditableKeyboardTarget(document.createElement("article"))).toBe(false);
  });

  it("projects the core Zen state into a centered Documents reading column", () => {
    const css = readFileSync("themes/documents/src/theme.css", "utf8");

    expect(css).toMatch(/shell--zen\s*> \.viewer-pane\s*\{[^}]*padding-right:\s*0;/s);
    expect(css).toContain(".theme-surface--documents:not(.shell--zen):has(");
    expect(css).toMatch(
      /shell--zen\s*\.documents-reader\s*\{[^}]*width:\s*min\(72ch,[^}]*margin-inline:\s*auto;/s,
    );
    expect(css).toMatch(
      /shell--zen\s*\.documents-reader-main\s*\{[^}]*max-width:\s*72ch;[^}]*margin:\s*0 auto;/s,
    );
    expect(css).toContain(".documents-document-meta,");
    expect(css).toContain(".documents-context-rail,");
  });
});
