import { describe, expect, it } from "vitest";
import { devServerAssetPath } from "../src/devServerBasePath";

describe("development deployment-base asset paths", () => {
  it("strips the Pages base only for real static resources", () => {
    expect(devServerAssetPath("/org-zhixing-themes/assets/app.js", "/org-zhixing-themes")).toBe(
      "/assets/app.js",
    );
    expect(
      devServerAssetPath("/org-zhixing-themes/org-zhixing.static.json", "/org-zhixing-themes/"),
    ).toBe("/org-zhixing.static.json");
    expect(devServerAssetPath("/org-zhixing-themes/favicon.svg", "/org-zhixing-themes")).toBe(
      "/favicon.svg",
    );
    expect(devServerAssetPath("/org-zhixing-themes/zhixing-mark.svg", "/org-zhixing-themes")).toBe(
      "/zhixing-mark.svg",
    );
    expect(
      devServerAssetPath("/org-zhixing-themes/org-zhixing.gallery.json", "/org-zhixing-themes"),
    ).toBe("/org-zhixing.gallery.json");
    expect(
      devServerAssetPath(
        "/org-zhixing-themes/org-zhixing.sources/org-zen-essay.json",
        "/org-zhixing-themes",
      ),
    ).toBe("/org-zhixing.sources/org-zen-essay.json");
    expect(
      devServerAssetPath(
        "/org-zhixing-themes/org-zhixing.agenda/org-agenda-lab.json",
        "/org-zhixing-themes",
      ),
    ).toBe("/org-zhixing.agenda/org-agenda-lab.json");
    expect(devServerAssetPath("/org-zhixing-themes/blogs", "/org-zhixing-themes")).toBeNull();
    expect(devServerAssetPath("/assets/app.js", "/org-zhixing-themes")).toBeNull();
  });
});
