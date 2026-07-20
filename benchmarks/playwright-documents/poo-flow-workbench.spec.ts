import { expect, test } from "@playwright/test";

test.setTimeout(30_000);

test.afterEach(async ({ page }) => {
  await page.close();
});

test("POO Flow workbench modes, semantic map, and breakpoints remain coherent", async ({
  page,
}) => {
  await page.goto("/10-architecture-examples-poo-flow-runtime");
  const figure = page.locator(".org-poo-flow");
  const nodes = figure.locator(".react-flow__node");
  await expect(nodes).toHaveCount(8);

  const modeGroup = figure.getByRole("group", { name: "Graph mode" });
  await expect(modeGroup.getByRole("button", { name: "Run", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  await modeGroup.getByRole("button", { name: "Explore", exact: true }).click();
  await nodes.first().click();
  await page.keyboard.press("Backspace");
  await expect(nodes).toHaveCount(8);
  await page.keyboard.press("Escape");
  await expect(figure.getByRole("region", { name: "Scheme object inspector" })).toHaveCount(0);

  await figure.getByRole("button", { name: "Show semantic minimap" }).click();
  await expect(figure.locator(".poo-flow-semantic-minimap")).toBeVisible();
  await figure.getByRole("button", { name: "Hide semantic minimap" }).click();
  await expect(figure.locator(".poo-flow-semantic-minimap")).toHaveCount(0);

  const breakpointNode = figure.getByRole("article", {
    name: "Case research-case, pending",
    exact: true,
  });
  await breakpointNode.click();
  const objectInspector = figure.getByRole("region", { name: "Scheme object inspector" });
  const nodeBreakpoint = objectInspector.getByRole("button", {
    name: "Add breakpoint research-case",
    exact: true,
  });
  await nodeBreakpoint.click();
  await expect(
    objectInspector.getByRole("button", {
      name: "Remove breakpoint research-case",
      exact: true,
    }),
  ).toHaveAttribute("aria-pressed", "true");
  await figure.getByRole("button", { name: "Close object details", exact: true }).click();

  await figure.getByRole("button", { name: "Inspect checkpoint compose", exact: true }).click();
  const checkpointInspector = figure.getByRole("region", { name: "Checkpoint inspector" });
  const edgeBreakpoint = checkpointInspector.getByRole("button", {
    name: "Add checkpoint breakpoint compose",
    exact: true,
  });
  await edgeBreakpoint.click();
  const removeEdgeBreakpoint = checkpointInspector.getByRole("button", {
    name: "Remove checkpoint breakpoint compose",
    exact: true,
  });
  await expect(removeEdgeBreakpoint).toHaveAttribute("aria-pressed", "true");
  await removeEdgeBreakpoint.click();
  await figure.getByRole("button", { name: "Close checkpoint details", exact: true }).click();

  await modeGroup.getByRole("button", { name: "Compose", exact: true }).click();
  await expect(figure.locator(".poo-flow-graph")).toHaveAttribute("data-graph-mode", "compose");
  await expect(figure.locator(".poo-flow-graph")).toHaveAttribute("data-connectable", "false");

  await modeGroup.getByRole("button", { name: "Run", exact: true }).click();
  await breakpointNode.click();
  await objectInspector.getByRole("button", { name: "Run to research-case", exact: true }).click();
  await expect(figure.locator(".poo-flow-runner__status")).toContainText("Paused · step 3/8", {
    timeout: 5_000,
  });
});
