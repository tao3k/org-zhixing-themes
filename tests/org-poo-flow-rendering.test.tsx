import { act, createElement } from "react";
import { describe, expect, it, vi } from "vitest";

import {
  findOrgPooFlowBlocks,
  installOrgPooFlowRendering,
  readPooFlowProjection,
  type PooFlowRunResult,
  type PooFlowRunner,
} from "../src/react/orgPooFlowRendering";

function fixture() {
  document.body.innerHTML = `
    <main>
      <pre class="src src-scheme" data-poo-flow="true">(workflow (step validate) (step publish))</pre>
      <pre data-poo-flow="true"><code class="language-scheme">(workflow (step archive))</code></pre>
    </main>
  `;
  return document.querySelector("main") as HTMLElement;
}

describe("Org Poo Flow rendering", () => {
  it("finds explicitly marked Scheme workflow blocks without inventing a language", () => {
    const root = fixture();
    expect(findOrgPooFlowBlocks(root)).toHaveLength(2);
  });

  it("keeps source readable and runs through an injected runtime lazily", async () => {
    const root = fixture();
    const runner: PooFlowRunner = {
      run: vi.fn(
        async (): Promise<PooFlowRunResult> => ({
          events: [
            { id: "validate", label: "Validate", state: "completed" },
            { id: "publish", label: "Publish", state: "completed" },
          ],
        }),
      ),
    };
    const loader = vi.fn(async () => ({
      PooFlowGraph: ({ result }: { result: { events: readonly unknown[] } }) =>
        createElement("output", null, `${result.events.length} graph events`),
    }));
    const stop = installOrgPooFlowRendering(root, runner, loader);

    const figure = root.querySelector(".org-poo-flow") as HTMLElement;
    const button = figure.querySelector("button") as HTMLButtonElement;
    expect(figure.textContent).toContain("(workflow (step validate)");
    expect(loader).not.toHaveBeenCalled();

    await act(async () => {
      button.click();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(runner.run).toHaveBeenCalledOnce();
    expect(loader).toHaveBeenCalledOnce();
    expect(figure.dataset.state).toBe("complete");
    expect(figure.textContent).toContain("2 graph events");

    act(() => stop());
    expect(root.querySelectorAll(".org-poo-flow")).toHaveLength(0);
    expect(findOrgPooFlowBlocks(root)).toHaveLength(2);
  });

  it("exposes a stable source fallback when no runtime adapter is configured", () => {
    const root = fixture();
    const stop = installOrgPooFlowRendering(root, undefined, vi.fn());
    const button = root.querySelector(".org-poo-flow__run") as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(root.textContent).toContain("Runtime adapter not connected");
    stop();
  });

  it("opens a validated embedded projection without pretending to execute Scheme", async () => {
    const root = fixture();
    const block = root.querySelector("pre") as HTMLElement;
    block.insertAdjacentHTML(
      "afterend",
      `<script type="application/vnd.poo-flow.projection+json">{
        "events":[{"id":"a","label":"Receive","state":"completed"},{"id":"b","label":"Publish","state":"completed"}],
        "edges":[{"source":"a","target":"b"}]
      }</script>`,
    );
    expect(readPooFlowProjection(block)?.events).toHaveLength(2);
    const loader = vi.fn(async () => ({
      PooFlowGraph: ({ result }: { result: { events: readonly unknown[] } }) =>
        createElement("output", null, `${result.events.length} projected events`),
    }));
    const stop = installOrgPooFlowRendering(root, undefined, loader);
    const figure = root.querySelector(".org-poo-flow") as HTMLElement;
    expect(figure.textContent).toContain("Projection ready");

    await act(async () => {
      (figure.querySelector("button") as HTMLButtonElement).click();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(figure.textContent).toContain("2 projected events");
    act(() => stop());
  });

  it("replaces an existing preview idempotently across installer reloads", () => {
    const root = fixture();
    const firstStop = installOrgPooFlowRendering(root, undefined, vi.fn());
    const secondStop = installOrgPooFlowRendering(root, undefined, vi.fn());

    expect(root.querySelectorAll(".org-poo-flow")).toHaveLength(2);
    expect(findOrgPooFlowBlocks(root)).toHaveLength(2);

    act(() => firstStop());
    expect(root.querySelectorAll(".org-poo-flow")).toHaveLength(2);
    act(() => secondStop());
    expect(root.querySelectorAll(".org-poo-flow")).toHaveLength(0);
  });

  it("reveals the graph host before React renders into it", async () => {
    const root = fixture();
    const runner: PooFlowRunner = {
      run: vi.fn(async () => ({ events: [{ id: "run", label: "Run" }] })),
    };
    let hiddenDuringRender = true;
    const stop = installOrgPooFlowRendering(root, runner, async () => ({
      PooFlowGraph: () => {
        hiddenDuringRender = (root.querySelector(".org-poo-flow__graph-host") as HTMLElement)
          .hidden;
        return createElement("output", null, "visible graph");
      },
    }));

    await act(async () => {
      (root.querySelector(".org-poo-flow__run") as HTMLButtonElement).click();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(hiddenDuringRender).toBe(false);
    act(() => stop());
  });
});
