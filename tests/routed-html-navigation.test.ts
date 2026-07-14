import { describe, expect, it } from "vitest";
import { routedHtmlNavigationTarget } from "../src/react/RoutedHtmlSurface";

const click = (href: string, overrides = {}) => ({
  activation: "primary" as const,
  download: false,
  href,
  target: null,
  ...overrides,
});

describe("routed HTML navigation", () => {
  it("routes plain same-origin document clicks without a page reload", () => {
    expect(
      routedHtmlNavigationTarget(
        click("/10-architecture-content"),
        "http://127.0.0.1:5190/00-index",
      ),
    ).toBe("/10-architecture-content");
    expect(
      routedHtmlNavigationTarget(
        click("/org-zhixing-themes/10-architecture-content?mode=read#contract"),
        "https://example.test/org-zhixing-themes/00-index",
        "/org-zhixing-themes",
      ),
    ).toBe("/10-architecture-content?mode=read#contract");
  });

  it("preserves browser-native clicks that should not become SPA navigation", () => {
    const current = "https://example.test/docs/current";
    expect(routedHtmlNavigationTarget(click("https://other.test/doc"), current)).toBeNull();
    expect(routedHtmlNavigationTarget(click("#section"), current)).toBeNull();
    expect(
      routedHtmlNavigationTarget(click("/doc", { activation: "modified" }), current),
    ).toBeNull();
    expect(
      routedHtmlNavigationTarget(click("/doc", { activation: "non-primary" }), current),
    ).toBeNull();
    expect(routedHtmlNavigationTarget(click("/doc", { download: true }), current)).toBeNull();
    expect(routedHtmlNavigationTarget(click("/doc", { target: "_blank" }), current)).toBeNull();
  });
});
