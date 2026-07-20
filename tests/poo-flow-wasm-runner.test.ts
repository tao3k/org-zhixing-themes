import type { PooFlowWasmRuntime } from "@poo-flow/runtime-wasm";
import { describe, expect, it, vi } from "vitest";

import { createPooFlowWasmRunner } from "../src/react/pooFlowWasmRunner";

describe("POO Flow WASM runner", () => {
  it("projects the generated typed plan and delegates cursor state to WASM", async () => {
    let completedSteps = 0;
    let released = false;
    const session = {
      position: vi.fn(() => ({ completedSteps, stepCount: 6 })),
      step: vi.fn(() => ({
        completedSteps: (completedSteps = Math.min(6, completedSteps + 1)),
        stepCount: 6,
      })),
      reset: vi.fn(() => ({ completedSteps: (completedSteps = 0), stepCount: 6 })),
      release: vi.fn(() => {
        released = true;
      }),
      get stepCount() {
        return 6;
      },
      get released() {
        return released;
      },
    };
    const openWorkflow = vi.fn(() => session);
    const runtime = { openWorkflow } as unknown as PooFlowWasmRuntime;
    const runner = createPooFlowWasmRunner(async () => runtime);

    const result = await runner.run("(scheme-flow ...)", {
      signal: new AbortController().signal,
      workflowId: "browser-contribution",
    });

    expect(result.events).toHaveLength(6);
    expect(result.edges).toHaveLength(5);
    expect(result.events.map(({ kind }) => kind)).toEqual(Array(6).fill("scheme"));
    expect(openWorkflow).toHaveBeenCalledExactlyOnceWith(6);
    expect(result.execution?.step()).toEqual({ completedSteps: 1, stepCount: 6 });
    expect(result.execution?.reset()).toEqual({ completedSteps: 0, stepCount: 6 });
    result.execution?.release();
    expect(session.release).toHaveBeenCalledOnce();
  });

  it("rejects missing and unknown generated workflow ids", async () => {
    const runner = createPooFlowWasmRunner(async () => {
      throw new Error("runtime must not load for invalid ids");
    });
    const signal = new AbortController().signal;

    await expect(runner.run("", { signal })).rejects.toThrow("POO-FLOW-E002");
    await expect(runner.run("", { signal, workflowId: "not-registered" })).rejects.toThrow(
      "POO-FLOW-E003",
    );
  });
});
