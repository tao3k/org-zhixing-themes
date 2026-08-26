import { expect, test } from "@playwright/test";

test("Documents renders Typst inside one bounded semantic frame", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/90-operations-90-05-typst-performance", {
    waitUntil: "domcontentloaded",
  });

  const frame = page.locator("figure.org-typst-block");
  await expect(frame).toHaveCount(1);
  await expect(frame.locator(":scope > .org-typst-preview")).toHaveAttribute(
    "data-org-typst-state",
    "ready",
  );
  await expect(frame.locator(":scope > figcaption")).toHaveCount(1);
  await expect(frame.locator("figure")).toHaveCount(0);
  await expect(frame.locator(".org-block-frame")).toHaveCount(0);
  await expect(frame).not.toContainText("BLOCK");

  const bounds = await frame.evaluate((element) => {
    const frameRect = element.getBoundingClientRect();
    const contentRect = element.parentElement?.getBoundingClientRect();
    return {
      contentRight: contentRect?.right ?? document.documentElement.clientWidth,
      frameLeft: frameRect.left,
      frameRight: frameRect.right,
      frameWidth: frameRect.width,
      viewportWidth: document.documentElement.clientWidth,
    };
  });
  expect(bounds.frameLeft).toBeGreaterThanOrEqual(-1);
  expect(bounds.frameRight).toBeLessThanOrEqual(bounds.contentRight + 1);
  expect(bounds.frameWidth).toBeLessThanOrEqual(bounds.viewportWidth + 1);
  expect(errors).toEqual([]);
});
