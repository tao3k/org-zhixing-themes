import { describe, expect, it } from "vitest";
import {
  routedAnchorNavigationFromEvent,
  routedHtmlNavigationTarget,
} from "../src/react/RoutedHtmlSurface";

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

  it("delegates plain React anchors once and ignores already handled events", () => {
    const anchor = document.createElement("a");
    anchor.href = "/platform";
    const label = document.createElement("span");
    anchor.append(label);
    const event = {
      altKey: false,
      button: 0,
      ctrlKey: false,
      defaultPrevented: false,
      metaKey: false,
      shiftKey: false,
      target: label,
    } as unknown as Parameters<typeof routedAnchorNavigationFromEvent>[0];

    expect(routedAnchorNavigationFromEvent(event, "https://example.test/", "/")).toEqual({
      anchor,
      target: "/platform",
    });
    expect(
      routedAnchorNavigationFromEvent(
        { ...event, defaultPrevented: true },
        "https://example.test/",
        "/",
      ),
    ).toBeNull();
  });
});
