import { describe, expect, it } from "vitest";
import { createDocumentView } from "../src/model";
import { applyOrgSemanticEnhancements } from "../src/react/orgContentEnhancements";
import { sectionRecord } from "./modelFixtures";

describe("Org semantic content enhancements", () => {
  it("renders parser-projected TODO and priority markers without reading heading text", () => {
    const root = document.createElement("div");
    root.innerHTML = "<h2>Ship the native renderer</h2>";
    const documentView = createDocumentView(
      [],
      null,
      [
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
      ],
    );

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
});
