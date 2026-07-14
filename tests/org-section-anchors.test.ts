import { describe, expect, it } from "vitest";
import { bindOrgSectionAnchors } from "../src/react/orgSectionAnchors";

describe("Org section anchors", () => {
  it("binds asynchronously rendered Org headings to indexed section ids", async () => {
    const root = document.createElement("div");
    const dispose = bindOrgSectionAnchors(root, [
      { id: "section-199", title: "RFC Record" },
      { id: "section-8797", title: "Performance Requirements" },
    ]);

    root.innerHTML = "<h2>RFC Record</h2><p>content</p><h2>Performance Requirements</h2>";
    await Promise.resolve();

    expect(root.querySelectorAll("h2")[0]?.id).toBe("section-199");
    expect(root.querySelectorAll("h2")[1]?.id).toBe("section-8797");
    dispose();
  });

  it("does not assign an indexed id to an unrelated heading", () => {
    const root = document.createElement("div");
    root.innerHTML = "<h2>Unrelated</h2>";
    const dispose = bindOrgSectionAnchors(root, [{ id: "section-199", title: "RFC Record" }]);

    expect(root.querySelector("h2")?.id).toBe("");
    dispose();
  });
});
