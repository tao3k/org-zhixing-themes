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

  it("owns arbitrarily nested theme routes at the root without routing them through Blog", () => {
    const router = readFileSync("src/react/router.tsx", "utf8");
    expect(router).toContain('path: "/$"');
    expect(router).toContain("params._splat");
    expect(router).toContain("component: HomePage");
    expect(router).toContain("redirectToThemeContentRoot");
    expect(router).toContain("function ThemeDocumentPage");
  });

  it("leaves static theme navigation to the browser instead of intercepting it as a router route", () => {
    const shellChrome = readFileSync("src/react/ShellChrome.tsx", "utf8");
    expect(shellChrome).toContain('closest("a[data-theme-navigation-item]")');
    expect(shellChrome).toContain("if (\n        event.target instanceof Element");
  });
});
