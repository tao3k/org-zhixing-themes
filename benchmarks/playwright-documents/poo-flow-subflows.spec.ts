import { expect, test } from "@playwright/test";

test.afterEach(async ({ page }) => {
  await page.close();
});

const scenarios = [
  {
    id: "subagent-workflow",
    label: "Subagent research workflow",
    childCount: 5,
  },
  {
    id: "funflow",
    label: "Funflow quality pipeline",
    childCount: 5,
  },
] as const;

test("generated Scheme scenarios render and collapse as native compound subflows", async ({
  page,
}) => {
  await page.goto("/poo-flow-subflows");
  const graphs = page.locator(".org-poo-flow");
  await expect(graphs).toHaveCount(2);

  for (const [index, scenario] of scenarios.entries()) {
    const graph = graphs.nth(index);
    await graph.scrollIntoViewIfNeeded();
    await expect(graph.locator(".poo-flow-graph")).toHaveAttribute("data-poo-flow-layout", "ready");
    const root = graph.locator(`[data-poo-flow-scenario="${scenario.id}"]`);
    await expect(root).toBeVisible();
    const layoutDuration = Number(
      await graph.locator(".poo-flow-graph").getAttribute("data-poo-flow-layout-ms"),
    );
    expect(layoutDuration).toBeGreaterThanOrEqual(0);
    expect(layoutDuration).toBeLessThan(500);
    const rootId = await root.getAttribute("data-poo-flow-id");
    expect(rootId).toBeTruthy();

    const children = graph.locator(`[data-poo-flow-parent-id="${rootId}"]`);
    await expect(children).toHaveCount(scenario.childCount);
    await expect(
      root.getByRole("button", { name: `Collapse ${scenario.label}`, exact: true }),
    ).toHaveAttribute("aria-expanded", "true");

    await root.getByRole("button", { name: `Collapse ${scenario.label}`, exact: true }).click();
    await expect(children).toHaveCount(0);
    await expect(
      root.getByRole("button", { name: `Expand ${scenario.label}`, exact: true }),
    ).toHaveAttribute("aria-expanded", "false");

    await root.getByRole("button", { name: `Expand ${scenario.label}`, exact: true }).click();
    await expect(children).toHaveCount(scenario.childCount);
  }
});
