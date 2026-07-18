import { expect, test } from "@playwright/test";
import { scenarioSitePath } from "./sitePath";

test("gallery deep links retain their deployment base and images after reload", async ({
  page,
}) => {
  await page.goto(scenarioSitePath("/gallery"));
  await expect(page).toHaveURL(/\/gallery\/?$/);
  await expect(page.locator(".attachment-card img")).toHaveCount(4);

  await page.reload();

  await expect(page).toHaveURL(/\/gallery\/?$/);
  const images = page.locator(".attachment-card img");
  await expect(images).toHaveCount(4);
  expect(
    await images.evaluateAll((nodes: HTMLImageElement[]) =>
      nodes.map((image) => ({ complete: image.complete, width: image.naturalWidth })),
    ),
  ).toEqual([
    { complete: true, width: 704 },
    { complete: true, width: 704 },
    { complete: true, width: 704 },
    { complete: true, width: 704 },
  ]);
});

test("gallery viewer keeps original-image geometry stable while opening", async ({ page }) => {
  await page.goto("./");
  await page
    .locator('a[href*="gallery"]')
    .first()
    .evaluate((link: HTMLAnchorElement) => link.click());
  await expect(page).toHaveURL(/\/gallery\/?$/);
  await expect(page.locator('[data-attachment-viewer-ready="true"]')).toBeAttached();

  const opener = page.locator(".attachment-card a").first();
  await opener.locator("img").evaluate((image: HTMLImageElement) => image.decode());

  await page.route("**/org-zhixing.media/**", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 150));
    await route.continue();
  });

  await opener.click();

  const activeSlide = page.locator('.pswp__item[aria-hidden="false"]');
  const fullImage = activeSlide.locator("img.pswp__img:not(.pswp__img--placeholder)");
  await expect(fullImage).toBeVisible();

  const measure = async () => ({
    dimensions: await opener.evaluate((node: HTMLAnchorElement) => ({
      width: Number(node.dataset.pswpWidth),
      height: Number(node.dataset.pswpHeight),
      href: node.href,
    })),
    image: await fullImage.evaluate((node: HTMLImageElement) => {
      const bounds = node.getBoundingClientRect();
      return {
        src: node.currentSrc || node.src,
        width: bounds.width,
        height: bounds.height,
      };
    }),
    transform: await activeSlide
      .locator(".pswp__zoom-wrap")
      .evaluate((node) => getComputedStyle(node).transform),
  });

  const firstFrame = await measure();
  await page.waitForTimeout(500);
  const settledFrame = await measure();

  expect(firstFrame.dimensions.width).toBeGreaterThan(0);
  expect(firstFrame.dimensions.height).toBeGreaterThan(0);
  expect(firstFrame.image.src).toBe(firstFrame.dimensions.href);
  expect(firstFrame.image.width).toBeCloseTo(settledFrame.image.width, 1);
  expect(firstFrame.image.height).toBeCloseTo(settledFrame.image.height, 1);
  expect(firstFrame.transform).toBe(settledFrame.transform);
});
