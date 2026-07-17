import { expect, test } from "@playwright/test";

const typstFixtureRoute = "/90-operations-90-05-typst-performance";

test.describe("Typst rendering scenario", () => {
  test("renders a complex document and reuses its persistent SVG cache", async ({ page }) => {
    const startedAt = performance.now();
    await page.goto(typstFixtureRoute, { waitUntil: "domcontentloaded" });

    const previews = page.locator(".org-typst-preview");
    await expect(previews).toHaveCount(1);
    await expect(previews.nth(0)).toHaveAttribute("data-org-typst-state", "ready", {
      timeout: 5_000,
    });
    const firstReadyMs = performance.now() - startedAt;

    expect(firstReadyMs).toBeLessThan(5_000);
    await expect(previews.locator("img")).toHaveCount(1);

    const blockHeights = await page
      .locator(".org-typst-block")
      .evaluateAll((blocks) => blocks.map((block) => block.getBoundingClientRect().height));
    expect(Math.max(...blockHeights)).toBeLessThan(210);

    const warmStartedAt = performance.now();
    await page.reload({ waitUntil: "domcontentloaded" });
    const warmPreviews = page.locator(".org-typst-preview");
    await expect(warmPreviews).toHaveCount(1);
    await expect(warmPreviews.nth(0)).toHaveAttribute("data-org-typst-state", "ready", {
      timeout: 1_500,
    });
    const warmReadyMs = performance.now() - warmStartedAt;
    expect(warmReadyMs).toBeLessThan(1_500);
    expect(warmReadyMs).toBeLessThan(firstReadyMs);
  });
});
