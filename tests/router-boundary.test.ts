import { describe, expect, it } from "vitest";
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
});
