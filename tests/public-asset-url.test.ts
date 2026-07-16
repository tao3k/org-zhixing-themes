import { afterEach, describe, expect, it, vi } from "vitest";
import { attachmentPublicPath } from "../src/attachmentPaths";
import { publicAssetUrl } from "../src/config";

describe("public asset URLs", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    window.history.replaceState(null, "", "/");
  });

  it("keeps lazy shards at the configured site root from a nested route", () => {
    vi.stubGlobal("__ORG_ZHIXING_BASE_PATH__", "/org-zhixing-themes");
    window.history.replaceState(null, "", "/org-zhixing-themes/blogs/465");

    expect(publicAssetUrl("org-zhixing.sources/wallpaper-gallery.json").pathname).toBe(
      "/org-zhixing-themes/org-zhixing.sources/wallpaper-gallery.json",
    );
    expect(publicAssetUrl("blog/.attach/00/example.jpeg").pathname).toBe(
      "/org-zhixing-themes/blog/.attach/00/example.jpeg",
    );
  });

  it("projects hidden Org attachment directories onto a Pages-safe media path", () => {
    const record = {
      directoryPath: "blog/.attach/00/example-id",
      linkPath: "wallpaper.jpeg",
    } as Parameters<typeof attachmentPublicPath>[0];

    expect(attachmentPublicPath(record, "blog/wallpaper-gallery.org")).toBe(
      "org-zhixing.media/blog/attach/00/example-id/wallpaper.jpeg",
    );
  });
});
