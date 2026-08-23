import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { normalizeOrgZhixingBasePath } from "../src/react/deploymentBasePath";
import { routePathForView } from "../src/react/routeViewHelpers";

describe("React Router boundary", () => {
  it("uses path-first routes for every Org Zhixing view", () => {
    expect(routePathForView("blog")).toBe("/blogs");
    expect(routePathForView("gallery")).toBe("/gallery");
    expect(routePathForView("records")).toBe("/notes");
    expect(routePathForView("travel")).toBe("/travel");
    expect(routePathForView("memory")).toBe("/memory");
    expect(routePathForView("agenda")).toBe("/agenda");
    expect(routePathForView("capture")).toBe("/capture");
    expect(routePathForView("diagnostics")).toBe("/diagnostics");
  });

  it("normalizes the GitHub Pages project base path without a router plugin", () => {
    expect(normalizeOrgZhixingBasePath("")).toBe("/");
    expect(normalizeOrgZhixingBasePath("/")).toBe("/");
    expect(normalizeOrgZhixingBasePath("org-zhixing-themes")).toBe("/org-zhixing-themes");
    expect(normalizeOrgZhixingBasePath("/org-zhixing-themes/")).toBe("/org-zhixing-themes");
  });

  it("routes registered theme previews before the document catch-all", () => {
    const router = readFileSync("src/react/router.tsx", "utf8");
    expect(router).toContain('path: "/themes/$themeId"');
    expect(router).toContain('path: "/themes/$themeId/$documentId"');
    expect(router).toContain("loadThemePreviewQuery(context, params.themeId)");
    expect(router).toContain(
      "loadThemePreviewDocumentQuery(context, params.themeId, params.documentId)",
    );
    expect(router.indexOf("themePreviewRoute,")).toBeLessThan(
      router.indexOf("themeDocumentRoute,"),
    );
    expect(router).toContain('path: "/$"');
    expect(router).toContain("params._splat");
    expect(router).toContain("isThemePreviewPath(location.pathname)");
    expect(router).toContain("<ThemeRootLayout");
    expect(router).toContain("theme={runtime.selectedTheme}");
    const loaders = readFileSync("src/react/routerLoaders.ts", "utf8");
    expect(loaders).toContain("isolatedThemeCatalog.some");
    expect(loaders).toContain("throw notFound()");
    expect(loaders).toContain("loadThemeRuntimeById(themeId)");
    expect(loaders).toContain("loadThemeDocumentForTheme");
  });

  it("leaves static theme navigation to the browser instead of intercepting it as a router route", () => {
    const shellChrome = readFileSync("src/react/ShellChrome.tsx", "utf8");
    expect(shellChrome).toContain('closest("a[data-theme-navigation-item]")');
    expect(shellChrome).toContain("if (\n        event.target instanceof Element");
  });

  it("keeps route-aware Zen preference outside route-local component state", () => {
    const layout = readFileSync("src/react/ThemeRootLayout.tsx", "utf8");
    expect(layout).toContain("useZenReadingMode(routeZen)");
    expect(layout).toContain("onEnterZen={enterZenReadingMode}");
    expect(layout).toContain("onExitZen={immersiveZen ? exitZenReadingMode : undefined}");
    expect(layout).toContain("onToggleZen={() => toggleZenReadingMode(routeZen)}");
    expect(layout).not.toContain("useState(false);");
  });
});
