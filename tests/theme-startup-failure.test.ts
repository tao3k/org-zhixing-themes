import { describe, expect, it, vi } from "vitest";
import { renderThemeStartupFailure } from "../src/theme-system/react/renderThemeStartupFailure";

describe("federated theme startup recovery", () => {
  it("renders a safe retry surface before React is available", () => {
    const root = document.createElement("div");
    const retry = vi.fn();

    renderThemeStartupFailure(new Error("remote manifest unavailable"), retry, root);

    expect(root.textContent).toContain("Theme unavailable");
    expect(root.textContent).toContain("THEME-E034 remote manifest unavailable");
    root.querySelector("button")?.click();
    expect(retry).toHaveBeenCalledOnce();
  });
});
