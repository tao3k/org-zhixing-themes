import { expect, test } from "@playwright/test";

const typstFixtureRoute = "/90-operations-90-05-typst-performance";

test.describe("Typst rendering scenario", () => {
  test("renders the first document and reuses SVG for an identical source", async ({ page }) => {
    const startedAt = performance.now();
    await page.goto(typstFixtureRoute, { waitUntil: "domcontentloaded" });

    const previews = page.locator(".org-typst-preview");
    await expect(previews).toHaveCount(2);
    await expect(previews.nth(0)).toHaveAttribute("data-org-typst-state", "ready", {
      timeout: 5_000,
    });
    const firstReadyMs = performance.now() - startedAt;

    await expect(previews.nth(1)).toHaveAttribute("data-org-typst-state", "ready", {
      timeout: 500,
    });
    const repeatedSourceReadyMs = performance.now() - startedAt - firstReadyMs;

    expect(firstReadyMs).toBeLessThan(5_000);
    expect(repeatedSourceReadyMs).toBeLessThan(500);
    await expect(previews.locator("img")).toHaveCount(2);
  });
});
