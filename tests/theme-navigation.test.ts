import { describe, expect, it } from "vitest";

import { resolveThemeNavigationHref, themeNavigationItemsFrom } from "../src/themeNavigation";

describe("theme navigation contributions", () => {
  it("accepts valid theme-provided navigation items", () => {
    expect(
      themeNavigationItemsFrom({
        navigation: [
          { name: "Documents", href: "themes/documents/", description: "docs" },
          { name: "Invalid" },
        ],
      }),
    ).toEqual([{ name: "Documents", href: "themes/documents/", description: "docs" }]);
  });

  it("resolves relative preview routes beneath the deployment base", () => {
    expect(resolveThemeNavigationHref("themes/elegant-blog/", "/org-zhixing-themes/")).toBe(
      "/org-zhixing-themes/themes/elegant-blog/",
    );
  });
});
