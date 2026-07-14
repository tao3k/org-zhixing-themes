import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

type Budgets = {
  firstReadyMedianMs: number;
  firstReadyP95Ms: number;
  preparedToReadyMedianMs: number;
  preparedToReadyP95Ms: number;
  deferredReadyP95Ms: number;
  themeReadyP95Ms: number;
  headingFontPxMax: number;
  consoleErrors: number;
};

type Sample = {
  firstReadyMs: number;
  preparedToReadyMs: number;
  deferredReadyMs: number;
  themeReadyMs: number;
  headingFontPx: number;
  errors: string[];
};

const baseline = JSON.parse(
  readFileSync(new URL("../baselines/documents-mermaid.json", import.meta.url), "utf8"),
) as { sampleCount: number; route: string; budgets: Budgets };

const percentile = (values: number[], quantile: number): number => {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * quantile) - 1)];
};

test("documents Mermaid scenario stays inside its interaction budgets", async ({
  browser,
}, testInfo) => {
  const samples: Sample[] = [];
  for (let index = 0; index < baseline.sampleCount; index += 1) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));

    await page.goto(baseline.route, { waitUntil: "domcontentloaded" });
    const figures = page.locator(".org-mermaid");
    await expect(figures.first()).toBeAttached();
    await expect(figures.first()).toHaveAttribute("data-mermaid-state", "ready");

    const marks = await page.evaluate(() => ({
      prepared: performance.getEntriesByName("org-zhixing:mermaid-prepared")[0]?.startTime ?? 0,
      firstReady:
        performance.getEntriesByName("org-zhixing:mermaid-first-ready")[0]?.startTime ?? 0,
    }));
    const headingFontPx = await page
      .locator(".documents-document-header h1")
      .evaluate((heading) => Number.parseFloat(getComputedStyle(heading).fontSize));

    const deferredDurations: number[] = [];
    for (let figureIndex = 1; figureIndex < (await figures.count()); figureIndex += 1) {
      const figure = figures.nth(figureIndex);
      const started = performance.now();
      await figure.scrollIntoViewIfNeeded();
      await expect(figure).toHaveAttribute("data-mermaid-state", "ready");
      deferredDurations.push(performance.now() - started);
    }

    await figures.first().scrollIntoViewIfNeeded();
    const themeStarted = performance.now();
    await page.evaluate(() => {
      document.documentElement.dataset.themeVariant = "latte";
    });
    await expect(figures.first()).toHaveAttribute("data-mermaid-variant", "latte");

    samples.push({
      firstReadyMs: marks.firstReady,
      preparedToReadyMs: marks.firstReady - marks.prepared,
      deferredReadyMs: percentile(deferredDurations, 0.95),
      themeReadyMs: performance.now() - themeStarted,
      headingFontPx,
      errors,
    });
    await context.close();
  }

  const metrics = {
    firstReadyMedianMs: percentile(
      samples.map((sample) => sample.firstReadyMs),
      0.5,
    ),
    firstReadyP95Ms: percentile(
      samples.map((sample) => sample.firstReadyMs),
      0.95,
    ),
    preparedToReadyMedianMs: percentile(
      samples.map((sample) => sample.preparedToReadyMs),
      0.5,
    ),
    preparedToReadyP95Ms: percentile(
      samples.map((sample) => sample.preparedToReadyMs),
      0.95,
    ),
    deferredReadyP95Ms: percentile(
      samples.map((sample) => sample.deferredReadyMs),
      0.95,
    ),
    themeReadyP95Ms: percentile(
      samples.map((sample) => sample.themeReadyMs),
      0.95,
    ),
    headingFontPx: Math.max(...samples.map((sample) => sample.headingFontPx)),
    consoleErrors: samples.flatMap((sample) => sample.errors),
  };
  console.log(`documents-mermaid metrics ${JSON.stringify(metrics)}`);
  await testInfo.attach("documents-mermaid-metrics", {
    body: JSON.stringify({ metrics, samples }, null, 2),
    contentType: "application/json",
  });

  expect(metrics.firstReadyMedianMs).toBeLessThanOrEqual(baseline.budgets.firstReadyMedianMs);
  expect(metrics.firstReadyP95Ms).toBeLessThanOrEqual(baseline.budgets.firstReadyP95Ms);
  expect(metrics.preparedToReadyMedianMs).toBeLessThanOrEqual(
    baseline.budgets.preparedToReadyMedianMs,
  );
  expect(metrics.preparedToReadyP95Ms).toBeLessThanOrEqual(baseline.budgets.preparedToReadyP95Ms);
  expect(metrics.deferredReadyP95Ms).toBeLessThanOrEqual(baseline.budgets.deferredReadyP95Ms);
  expect(metrics.themeReadyP95Ms).toBeLessThanOrEqual(baseline.budgets.themeReadyP95Ms);
  expect(metrics.headingFontPx).toBeLessThanOrEqual(baseline.budgets.headingFontPxMax);
  expect(metrics.consoleErrors).toHaveLength(baseline.budgets.consoleErrors);
});
