import { describe, expect, it, vi } from "vitest";

import type { PooFlowWasmRuntime } from "@poo-flow/runtime-wasm";

import { createPooFlowWasmRunner, pooFlowWorkflowIds } from "../src/react/pooFlowWasmRunner";

function createRuntime() {
  const openWorkflow = vi.fn((stepCount: number) => {
    let completedSteps = 0;
    let released = false;
    return {
      position: () => ({ completedSteps, stepCount }),
      step: () => ({
        completedSteps: (completedSteps = Math.min(stepCount, completedSteps + 1)),
        stepCount,
      }),
      reset: () => ({ completedSteps: (completedSteps = 0), stepCount }),
      release: () => {
        released = true;
      },
      get stepCount() {
        return stepCount;
      },
      get released() {
        return released;
      },
    };
  });
  return {
    openWorkflow,
    runtime: { openWorkflow } as unknown as PooFlowWasmRuntime,
  };
}

describe.each([
  ["subagent-workflow", "subagent-workflow"],
  ["funflow", "funflow"],
] as const)("generated %s runtime projection", (workflowId, scenario) => {
  it("preserves structured compound identity through the WASM runner", async () => {
    const { openWorkflow, runtime } = createRuntime();
    const runner = createPooFlowWasmRunner(async () => runtime);
    const result = await runner.run("(generated-scenario)", {
      signal: new AbortController().signal,
      workflowId,
    });
    const ids = new Set(result.events.map(({ id }) => id));
    const root = result.events.find(({ id }) => id === result.rootId);
    const children = result.events.filter(({ parentId }) => parentId === result.rootId);

    expect(pooFlowWorkflowIds).toContain(workflowId);
    expect(root?.scenario).toBe(scenario);
    expect(children.length).toBeGreaterThanOrEqual(2);
    expect(result.events.every(({ parentId }) => !parentId || ids.has(parentId))).toBe(true);
    expect(result.edges).toBeDefined();
    expect(result.edges!.every(({ source, target }) => ids.has(source) && ids.has(target))).toBe(
      true,
    );
    expect(openWorkflow).toHaveBeenCalledWith(result.events.length);
  });
});
