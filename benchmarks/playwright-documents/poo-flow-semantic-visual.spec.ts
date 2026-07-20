import { expect, test } from "@playwright/test";

test("POO Flow projects semantic icons and a fluid active execution route", async ({ page }) => {
  await page.goto("/10-architecture-examples-poo-flow-runtime");

  const figure = page.locator(".org-poo-flow");
  await expect(figure.locator(".react-flow__node")).toHaveCount(8);
  await expect(figure.locator(".poo-flow-semantic-icon__glyph")).toHaveCount(8);
  const verticalLayout = await page.evaluate(() => window.matchMedia("(max-width: 720px)").matches);
  await expect(
    figure.locator(verticalLayout ? ".react-flow__handle-top" : ".react-flow__handle-left"),
  ).toHaveCount(8);
  await expect(
    figure.locator(verticalLayout ? ".react-flow__handle-bottom" : ".react-flow__handle-right"),
  ).toHaveCount(8);
  await expect
    .poll(() =>
      figure.evaluate((root) => {
        const label = root.querySelector<HTMLElement>(
          'button[aria-label="Inspect checkpoint compose"]',
        );
        const source = root.querySelector<HTMLElement>(
          'article[aria-label="Composition browser-profile-composition, pending"]',
        );
        const target = root.querySelector<HTMLElement>(
          'article[aria-label="Case real-scenario, pending"]',
        );
        if (!label || !source || !target) {
          return undefined;
        }
        const labelRect = label.getBoundingClientRect();
        const intersects = (element: HTMLElement) => {
          const rect = element.getBoundingClientRect();
          return !(
            labelRect.right <= rect.left ||
            labelRect.left >= rect.right ||
            labelRect.bottom <= rect.top ||
            labelRect.top >= rect.bottom
          );
        };
        return {
          sourceOverlap: intersects(source),
          targetOverlap: intersects(target),
        };
      }),
    )
    .toEqual({ sourceOverlap: false, targetOverlap: false });
  await expect
    .poll(() =>
      figure
        .locator(".poo-flow-node--profile-instance .poo-flow-shape__kind")
        .first()
        .evaluate((profile) => getComputedStyle(profile, "::before").display),
    )
    .toBe("none");
  await expect
    .poll(() =>
      figure.locator(".poo-flow-node--profile-instance").evaluateAll((elements) => {
        const rectangles = elements.map((element) => element.getBoundingClientRect());
        let minimum = Number.POSITIVE_INFINITY;
        for (let leftIndex = 0; leftIndex < rectangles.length; leftIndex += 1) {
          for (let rightIndex = leftIndex + 1; rightIndex < rectangles.length; rightIndex += 1) {
            const left = rectangles[leftIndex];
            const right = rectangles[rightIndex];
            const separation = Math.max(
              right.left - left.right,
              left.left - right.right,
              right.top - left.bottom,
              left.top - right.bottom,
              0,
            );
            minimum = Math.min(minimum, separation);
          }
        }
        return minimum;
      }),
    )
    .toBeGreaterThan(8);
  await expect
    .poll(() =>
      figure
        .locator(".poo-flow-node--profile-instance .poo-flow-semantic-icon__glyph")
        .first()
        .evaluate((icon) => {
          const style = getComputedStyle(icon);
          return {
            background: style.backgroundImage,
            border: style.borderTopWidth,
            radius: style.borderRadius,
            embossed: style.filter !== "none",
            width: style.width,
          };
        }),
    )
    .toEqual({
      background: "none",
      border: "0px",
      radius: "0px",
      embossed: true,
      width: "29px",
    });
  await expect
    .poll(() =>
      figure
        .getByRole("article", { name: "Case research-case, pending", exact: true })
        .evaluate((card) => {
          const label = card.querySelector<HTMLElement>(".poo-flow-shape__kind-label");
          if (!label) return Number.POSITIVE_INFINITY;
          const cardRect = card.getBoundingClientRect();
          const labelRect = label.getBoundingClientRect();
          return Math.abs(
            cardRect.left + cardRect.width / 2 - (labelRect.left + labelRect.width / 2),
          );
        }),
    )
    .toBeLessThan(2);

  await figure
    .getByRole("article", { name: "Composition browser-profile-composition, pending", exact: true })
    .click();
  await expect(figure.getByRole("region", { name: "Scheme object inspector" })).toBeVisible();
  await expect(figure.locator(".poo-flow-node--focus")).toHaveCount(1);
  await expect(figure.locator(".poo-flow-node--related")).not.toHaveCount(0);
  await expect(figure.locator(".poo-flow-node--dimmed")).not.toHaveCount(0);
  await figure.getByRole("button", { name: "Close object details" }).click();

  await expect(figure.locator(".react-flow__node.draggable")).not.toHaveCount(0);
  await figure.locator(".react-flow__pane").hover();
  await page.mouse.wheel(0, 2_400);
  await expect(figure.locator(".poo-flow-graph")).toHaveAttribute("data-poo-flow-zoom", "overview");

  await figure.getByRole("button", { name: "Reset", exact: true }).click();
  const stepButton = figure.getByRole("button", { name: "Step", exact: true });
  await expect(stepButton).toBeEnabled();
  await stepButton.click();

  await expect(figure.locator(".react-flow__edge.animated")).toHaveCount(1);
  await expect(figure.locator(".poo-flow-fluid-stream")).toHaveCount(1);
  await expect(figure.locator(".poo-flow-fluid-stream__pulse animateMotion")).toHaveCount(1);
  await figure
    .getByRole("article", {
      name: "Composition browser-profile-composition, completed",
      exact: true,
    })
    .click();
  await expect(figure.getByRole("region", { name: "Scheme object inspector" })).toContainText(
    "completed",
  );
  await figure.getByRole("button", { name: "Close object details", exact: true }).click();
  await figure.getByRole("button", { name: "Inspect checkpoint compose", exact: true }).click();
  await expect(figure.getByRole("region", { name: "Checkpoint inspector" })).toBeVisible();
  await expect(figure.locator(".poo-flow-edge--focus")).toHaveCount(1);
  await expect(figure.locator(".poo-flow-node--related")).not.toHaveCount(0);
  await figure.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(figure.getByRole("region", { name: "Checkpoint inspector" })).toHaveCount(0);
  await expect(figure.locator(".poo-flow-edge--focus")).toHaveCount(0);

  const graphBox = await figure.locator(".poo-flow-graph").boundingBox();
  const runnerBox = await figure
    .getByRole("toolbar", { name: "Workflow execution controls" })
    .boundingBox();
  if (!graphBox || !runnerBox) {
    throw new Error("POO Flow graph and runner must have measurable geometry");
  }
  const trailingSpace = graphBox.y + graphBox.height - (runnerBox.y + runnerBox.height);
  expect(trailingSpace).toBeGreaterThanOrEqual(0);
  expect(trailingSpace).toBeLessThanOrEqual(16);
});
