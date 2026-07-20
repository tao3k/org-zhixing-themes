import { expect, test } from "@playwright/test";

test("POO Flow runs the generated Profile composition through the WASM cursor", async ({
  page,
}, testInfo) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  const wasmResponse = page.waitForResponse(
    (response) => response.url().includes("poo_flow_runtime") && response.url().endsWith(".wasm"),
  );
  const navigationStarted = performance.now();
  await page.goto("/10-architecture-examples-poo-flow-runtime");
  const figure = page.locator("figure.org-poo-flow");
  await expect(figure).toBeVisible();
  const projectionMs = performance.now() - navigationStarted;

  await expect(page.locator("script[type='application/vnd.poo-flow.projection+json']")).toHaveCount(
    0,
  );

  const wasm = await wasmResponse;
  await wasm.finished();
  const wasmLoadMs = await page.evaluate((url) => {
    const entry = performance.getEntriesByName(url, "resource").at(-1) as
      | PerformanceResourceTiming
      | undefined;
    if (!entry) throw new Error(`POO-FLOW-BENCH-E005 missing WASM resource timing for ${url}`);
    return entry.responseEnd - entry.startTime;
  }, wasm.url());
  expect(wasm.status()).toBe(200);
  expect(new URL(wasm.url()).pathname).toMatch(/poo_flow_runtime\.[a-f0-9]+\.wasm$/);

  await expect(figure.locator(".react-flow__node")).toHaveCount(8);
  await expect(figure.locator(".react-flow__edge-path")).toHaveCount(7);
  await expect(figure.locator(".react-flow__minimap")).toHaveCount(0);
  await expect(figure.locator(".react-flow__attribution")).toHaveCount(0);

  await expect(figure.locator(".poo-flow-graph")).toHaveAttribute("data-poo-flow-layout", "ready");
  const sourceToggle = figure.getByRole("button", { name: "Source code", exact: true });
  await expect(sourceToggle).toHaveAttribute("aria-expanded", "false");
  await sourceToggle.click();
  await expect(sourceToggle).toHaveAttribute("aria-expanded", "true");
  await expect(figure).not.toHaveClass(/org-poo-flow--source-collapsed/);
  await expect(figure.locator("pre")).toBeVisible();
  await sourceToggle.click();
  await expect(sourceToggle).toHaveAttribute("aria-expanded", "false");
  await expect(figure).toHaveClass(/org-poo-flow--source-collapsed/);
  const graphCenterOffset = () =>
    figure.evaluate((root) => {
      const pane = root.querySelector<HTMLElement>(".react-flow__pane");
      const nodes = [...root.querySelectorAll<HTMLElement>(".react-flow__node")];
      if (!pane || nodes.length === 0) {
        throw new Error("POO-FLOW-BENCH-E003 missing pane or nodes for centering receipt");
      }
      const paneRect = pane.getBoundingClientRect();
      const nodeRects = nodes.map((node) => node.getBoundingClientRect());
      const left = Math.min(...nodeRects.map((rect) => rect.left));
      const right = Math.max(...nodeRects.map((rect) => rect.right));
      const top = Math.min(...nodeRects.map((rect) => rect.top));
      const bottom = Math.max(...nodeRects.map((rect) => rect.bottom));
      return Math.hypot(
        (left + right) / 2 - (paneRect.left + paneRect.right) / 2,
        (top + bottom) / 2 - (paneRect.top + paneRect.bottom) / 2,
      );
    });
  await expect.poll(graphCenterOffset).toBeLessThan(6);
  const stepMs = await figure.evaluate(async (root) => {
    const node = root.querySelector<HTMLElement>(".react-flow__node");
    const button = [...root.querySelectorAll<HTMLButtonElement>("button")].find(
      (candidate) => candidate.textContent?.trim() === "Step",
    );
    if (!node || !button) throw new Error("POO-FLOW-BENCH-E001 missing Step control or node");
    const committed = new Promise<void>((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        observer.disconnect();
        reject(new Error("POO-FLOW-BENCH-E002 Step DOM commit timed out"));
      }, 1_000);
      const observer = new MutationObserver(() => {
        if (!node.classList.contains("poo-flow-node--completed")) return;
        window.clearTimeout(timeout);
        observer.disconnect();
        resolve();
      });
      observer.observe(node, { attributeFilter: ["class"], attributes: true });
    });
    const started = performance.now();
    button.click();
    await committed;
    return performance.now() - started;
  });
  await expect(figure.locator(".react-flow__node").first()).toHaveClass(/poo-flow-node--completed/);

  await figure.getByRole("button", { name: "Step", exact: true }).click();
  await expect(figure.locator(".react-flow__node").nth(2)).toHaveClass(/poo-flow-node--running/);
  const pane = figure.locator(".react-flow__pane");
  const viewport = figure.locator(".react-flow__viewport");
  const initialViewportStyle = await viewport.getAttribute("style");
  const dragOrigin = await pane.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    for (let y = bounds.top + 24; y < bounds.bottom - 24; y += 32) {
      for (let x = bounds.left + 24; x < bounds.right - 24; x += 32) {
        const target = document.elementFromPoint(x, y);
        if (target === element || target?.classList.contains("react-flow__pane")) {
          return { x, y };
        }
      }
    }
    throw new Error("POO-FLOW-BENCH-E004 missing an interactive pane point");
  });
  await page.mouse.move(dragOrigin.x, dragOrigin.y);
  await page.mouse.down();
  await page.mouse.move(dragOrigin.x + 120, dragOrigin.y + 80, { steps: 5 });
  await page.mouse.up();
  expect(await viewport.getAttribute("style")).not.toBe(initialViewportStyle);
  await figure.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(figure.locator(".react-flow__node").first()).toHaveClass(/poo-flow-node--pending/);
  await expect.poll(graphCenterOffset).toBeLessThan(6);

  const layout = await page.evaluate(() => ({
    horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - innerWidth),
  }));
  const evidence = {
    schemaVersion: 1,
    route: "/poo-flow-runtime",
    projectionMs,
    wasmLoadMs,
    stepMs,
    wasmUrl: wasm.url(),
    nodeCount: await figure.locator(".react-flow__node").count(),
    edgeCount: await figure.locator(".react-flow__edge-path").count(),
    ...layout,
    consoleErrors,
    pageErrors,
  };
  console.log("poo-flow-runtime metrics", JSON.stringify(evidence));
  await testInfo.attach("poo-flow-runtime-evidence", {
    body: JSON.stringify(evidence, null, 2),
    contentType: "application/json",
  });

  expect(projectionMs).toBeLessThan(2_000);
  expect(wasmLoadMs).toBeLessThan(1_500);
  expect(stepMs).toBeLessThan(250);
  expect(layout.horizontalOverflow).toBe(0);
  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test("POO Flow preserves the user's viewport while execution advances", async ({ page }) => {
  await page.goto("/10-architecture-examples-poo-flow-runtime");
  const figure = page.locator(".org-poo-flow");
  await figure.scrollIntoViewIfNeeded();
  await page.locator(".poo-flow-graph .react-flow__node").first().waitFor();

  await expect(figure.locator(".react-flow__node-composition")).toHaveCount(1);
  await expect(figure.locator(".react-flow__node-case")).toHaveCount(3);
  await expect(figure.locator(".react-flow__node-profile-instance")).toHaveCount(4);
  const semanticSizes = await figure.locator(".react-flow__node").evaluateAll((nodes) =>
    nodes.map((node) => {
      const bounds = node.getBoundingClientRect();
      return `${Math.round(bounds.width)}x${Math.round(bounds.height)}`;
    }),
  );
  expect(new Set(semanticSizes).size).toBeGreaterThan(1);
  const transportGap = await figure.evaluate((element) => {
    const canvas = element.querySelector(".poo-flow-graph > .react-flow")?.getBoundingClientRect();
    const transport = element.querySelector(".poo-flow-runner")?.getBoundingClientRect();
    return canvas && transport ? transport.top - canvas.bottom : Number.NEGATIVE_INFINITY;
  });
  expect(transportGap).toBeGreaterThanOrEqual(0);

  await figure.getByRole("button", { name: "Reset" }).click();

  const viewport = page.locator(".react-flow__viewport");
  const pane = page.locator(".react-flow__pane");
  const initialTransform = await viewport.getAttribute("style");
  const paneBox = await pane.boundingBox();
  expect(paneBox).not.toBeNull();

  await page.mouse.move(paneBox!.x + 96, paneBox!.y + 96);
  await page.mouse.down();
  await page.mouse.move(paneBox!.x + 216, paneBox!.y + 168, { steps: 8 });
  await page.mouse.up();

  const userTransform = await viewport.getAttribute("style");
  expect(userTransform).not.toBe(initialTransform);

  await figure
    .getByRole("toolbar", { name: "Workflow execution controls" })
    .getByRole("button", { name: "Run", exact: true })
    .click();
  await page.waitForTimeout(500);
  expect(await viewport.getAttribute("style")).toBe(userTransform);

  await figure.getByRole("button", { name: "Reset" }).click();
  await expect.poll(() => viewport.getAttribute("style")).not.toBe(userTransform);
});
