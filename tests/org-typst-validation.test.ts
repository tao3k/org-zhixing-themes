import { describe, expect, it } from "vitest";

import { hasRenderableTypstSvg } from "../src/node/orgTypstValidation";

describe("Org Typst validation", () => {
  it("distinguishes visible output from definition-only SVG groups", () => {
    expect(hasRenderableTypstSvg('<svg><g class="typst-page"><g></g></g></svg>')).toBe(false);
    expect(hasRenderableTypstSvg('<svg><g class="typst-page"><path d="M0 0" /></g></svg>')).toBe(
      true,
    );
  });
});
