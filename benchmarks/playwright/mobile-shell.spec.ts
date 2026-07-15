import { expect, test } from "@playwright/test";
import { scenarioSitePath } from "./sitePath";

test("shell has no horizontal overflow or browser errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto(scenarioSitePath("/blogs"));
  await expect(page.locator("#app")).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );

  expect(overflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);

  if ((page.viewportSize()?.width ?? 0) < 768) {
    const trigger = page.getByRole("button", { name: "Open navigation" });
    await expect(trigger).toBeVisible();
    const box = await trigger.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
    await trigger.click();
    await expect(page.getByRole("dialog", { name: "Navigate Zhixing" })).toBeVisible();
    await page
      .getByRole("navigation", { name: "Mobile life archive navigation" })
      .getByRole("link", { name: /Notes/ })
      .click();
    await expect(page).toHaveURL(/\/notes$/);
    await expect(page.getByRole("dialog", { name: "Navigate Zhixing" })).toBeHidden();
  }
});

test("direct Gallery uses the responsive static hybrid shell", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto(scenarioSitePath("/gallery/"));
  await expect(page.locator('#app[data-static-route="gallery"]')).toBeVisible();
  await expect(page.locator(".attachment-card img").first()).toBeVisible();
  expect(await page.locator('script[type="module"]').count()).toBe(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    ),
  ).toBeLessThanOrEqual(0);

  if ((page.viewportSize()?.width ?? 0) < 768) {
    const menu = page.locator(".static-mobile-navigation summary");
    const box = await menu.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
    await menu.click();
    await expect(
      page.getByRole("navigation", { name: "Mobile life archive navigation" }),
    ).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test("direct Travel uses the static hybrid shell without eager interaction runtime", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto(scenarioSitePath("/travel/"));
  await expect(page.locator('#app[data-static-route="travel"]')).toBeVisible();
  await expect(page.locator(".travel-place-card").first()).toBeVisible();
  expect(await page.locator('script[type="module"]').count()).toBe(0);
  expect(errors).toEqual([]);
});

test("direct nested Blog article loads its shard and attachment images", async ({ page }) => {
  const errors: string[] = [];
  const failedResponses: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400) failedResponses.push(response.url());
  });

  await page.goto(scenarioSitePath("/blogs/465?source=blog%2Fwallpaper-gallery.org"));
  const firstImage = page.locator(".blog-article img").first();
  await expect(firstImage).toBeVisible();
  await expect.poll(() => firstImage.evaluate((image) => image.naturalWidth)).toBeGreaterThan(0);
  await expect(firstImage).toHaveAttribute("src", /\/org-zhixing-themes\/blog\/\.attach\/00\//);
  expect(failedResponses).toEqual([]);
  expect(errors).toEqual([]);
});
