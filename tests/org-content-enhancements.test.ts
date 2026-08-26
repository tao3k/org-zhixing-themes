import { describe, expect, it } from "vitest";
import { createDocumentView } from "../src/model";
import { applyOrgSemanticEnhancements } from "../src/react/orgContentEnhancements";
import { sectionRecord, sourceRange } from "./modelFixtures";

describe("Org semantic content enhancements", () => {
  it("leaves source-block frame ownership to the specialized renderer", () => {
    const root = document.createElement("div");
    root.innerHTML = `
      <pre class="src src-typst">= Native Typst</pre>
      <pre>plain example output</pre>
    `;

    applyOrgSemanticEnhancements(root, createDocumentView([], null, []));

    const typst = root.querySelector<HTMLElement>("pre.src-typst");
    expect(typst?.classList.contains("org-native-block--src")).toBe(true);
    expect(typst?.closest(".org-block-frame")).toBeNull();
    expect(root.querySelectorAll(".org-block-frame")).toHaveLength(1);
    expect(root.querySelector(".org-block-frame figcaption")?.textContent).toBe("BLOCK");
  });

  it("renders parser-projected TODO and priority markers without reading heading text", () => {
    const root = document.createElement("div");
    root.innerHTML = "<h2>Ship the native renderer</h2>";
    const documentView = createDocumentView([], null, [
      sectionRecord({
        level: 2,
        priority: {
          effective: "B",
          isDefault: false,
          profile: { default: "B", highest: "A", lowest: "C" },
          rangeStatus: "inRange",
          raw: "[#B]",
        },
        rangeStart: 42,
        title: "Ship the native renderer",
        todo: "TODO",
        todoState: "todo",
      }),
    ]);

    applyOrgSemanticEnhancements(root, documentView);

    const heading = root.querySelector("h2");
    expect(heading?.querySelector(".org-heading-todo")?.textContent).toBe("TODO");
    expect(heading?.querySelector(".org-heading-todo--todo")).toBeTruthy();
    expect(heading?.querySelector(".org-heading-priority")?.textContent).toBe("[#B]");
    expect(heading?.querySelector(".org-priority--b")).toBeTruthy();
    expect(heading?.querySelector(".org-heading-title")?.textContent).toBe(
      "Ship the native renderer",
    );
  });

  it("keeps section metadata singular across static rendering and React effect replay", () => {
    const root = document.createElement("div");
    root.innerHTML = '<h1 data-org-range-start="42">Why this syntax atlas exists</h1>';
    const documentView = createDocumentView([], null, [
      sectionRecord({
        effectiveTags: ["zhixing", "syntax", "atlas", "blog", "essay"],
        level: 1,
        planning: {
          closed: {
            end: null,
            isRange: false,
            kind: "inactive",
            raw: "[2026-05-16 Sat 08:20]",
            start: null,
          },
          deadline: null,
          scheduled: null,
        },
        properties: [
          {
            key: "SLUG",
            source: sourceRange(43),
            value: "syntax-atlas-purpose",
          },
          { key: "AREA", source: sourceRange(44), value: "frontend" },
          { key: "KIND", source: sourceRange(45), value: "article" },
        ],
        rangeStart: 42,
        title: "Why this syntax atlas exists",
      }),
    ]);

    applyOrgSemanticEnhancements(root, documentView);
    applyOrgSemanticEnhancements(root, documentView);

    expect(root.querySelectorAll(".org-section-meta")).toHaveLength(1);
    expect(root.querySelectorAll(".org-planning-chip--closed")).toHaveLength(1);
    expect(root.querySelectorAll(".org-meta-tag")).toHaveLength(5);
    expect(root.querySelectorAll(".org-meta-row--properties > div")).toHaveLength(3);
  });
});
