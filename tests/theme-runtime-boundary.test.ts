import { describe, expect, it } from "vitest";
import {
  claimThemeRuntimeBoundary,
  setThemeRuntimeBoundaryState,
} from "../src/theme-system/react/themeRuntimeBoundary";

describe("theme runtime boundary", () => {
  it("removes host presentation and binds the selected theme identity", () => {
    const root = document.createElement("div");
    root.innerHTML = "<strong>stale host brand</strong>";

    claimThemeRuntimeBoundary(
      {
        isolationId: "site#documents:mocha",
        themeId: "documents",
        variant: "mocha",
      },
      root,
    );

    expect(root.textContent).toBe("");
    expect(root.dataset).toMatchObject({
      themeIsolationId: "site#documents:mocha",
      themeId: "documents",
      themeVariant: "mocha",
      themeRuntimeState: "loading",
    });
    expect(root.getAttribute("aria-busy")).toBe("true");
  });

  it("exposes state without inventing a loading theme", () => {
    const root = document.createElement("div");
    setThemeRuntimeBoundaryState(root, "mounting");
    expect(root.getAttribute("aria-busy")).toBe("true");

    setThemeRuntimeBoundaryState(root, "mounted");
    expect(root.dataset.themeRuntimeState).toBe("mounted");
    expect(root.hasAttribute("aria-busy")).toBe(false);
    expect(root.textContent).toBe("");
  });
});
