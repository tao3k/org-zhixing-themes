import { describe, expect, it } from "vitest";

import { prepareTypstPreviewSource } from "../src/core/typstSource";

describe("Typst preview source", () => {
  it("uses a responsive page while allowing the document to override it", () => {
    const source = "#set page(width: 12cm, height: auto)\n= Document";
    const prepared = prepareTypstPreviewSource(source);

    expect(prepared).toContain("#set page(width: auto, height: auto, margin: 8pt)");
    expect(prepared.endsWith(source)).toBe(true);
  });
});
