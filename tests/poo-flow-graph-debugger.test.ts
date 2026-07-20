import { describe, expect, it } from "vitest";

import {
  createPooFlowDebuggerState,
  restorePooFlowDebugger,
  snapshotPooFlowDebugger,
  transitionPooFlowDebugger,
  validPooFlowBreakpointKeys,
} from "../src/poo-flow/graphDebugger";

function toggle(
  state: ReturnType<typeof createPooFlowDebuggerState>,
  kind: "node" | "edge",
  id: string,
) {
  return transitionPooFlowDebugger(state, {
    type: "toggle-breakpoint",
    target: { kind, id },
  });
}

describe("POO Flow graph debugger", () => {
  it("gives run-to precedence over node and incoming-edge breakpoints", () => {
    let state = createPooFlowDebuggerState("workflow");
    state = toggle(state, "node", "target");
    state = toggle(state, "edge", "incoming-a");
    state = transitionPooFlowDebugger(state, { type: "run-to", nodeId: "target" });
    state = transitionPooFlowDebugger(state, {
      type: "cursor-advanced",
      cursor: 2,
      activeNodeId: "target",
      incomingEdgeIds: ["incoming-a"],
      stepCount: 5,
      source: "timer",
    });

    expect(state.playing).toBe(false);
    expect(state.runToNodeId).toBeUndefined();
    expect(state.lastReceipt).toMatchObject({
      reason: "run-to",
      state: "paused",
      toCursor: 2,
    });
  });

  it("prefers a node breakpoint, then the first matching incoming edge", () => {
    let state = createPooFlowDebuggerState("workflow");
    state = toggle(state, "node", "target");
    state = toggle(state, "edge", "incoming-b");
    state = transitionPooFlowDebugger(state, {
      type: "cursor-advanced",
      cursor: 1,
      activeNodeId: "target",
      incomingEdgeIds: ["incoming-a", "incoming-b"],
      stepCount: 4,
      source: "timer",
    });
    expect(state.lastReceipt).toMatchObject({
      reason: "node-breakpoint",
      breakpointKey: "node:target",
    });

    state = toggle(state, "node", "target");
    state = transitionPooFlowDebugger(state, {
      type: "cursor-advanced",
      cursor: 2,
      activeNodeId: "next",
      incomingEdgeIds: ["incoming-a", "incoming-b"],
      stepCount: 4,
      source: "timer",
    });
    expect(state.lastReceipt).toMatchObject({
      reason: "edge-breakpoint",
      breakpointKey: "edge:incoming-b",
    });
  });

  it("preserves declared breakpoints across reset while clearing transient stops", () => {
    let state = createPooFlowDebuggerState("workflow");
    state = toggle(state, "node", "target");
    state = transitionPooFlowDebugger(state, { type: "run-to", nodeId: "target" });
    state = transitionPooFlowDebugger(state, {
      type: "reset",
      preserveBreakpoints: true,
    });

    expect(state).toMatchObject({ cursor: -1, playing: false });
    expect(state.breakpoints).toEqual(new Set(["node:target"]));
    expect(state.runToNodeId).toBeUndefined();
    expect(state.pausedBreakpointKey).toBeUndefined();
    expect(state.lastReceipt?.reason).toBe("reset");
  });

  it("filters stale breakpoint identities when a workflow is replaced", () => {
    let state = createPooFlowDebuggerState("old");
    state = toggle(state, "node", "keep");
    state = toggle(state, "edge", "stale");
    state = transitionPooFlowDebugger(state, {
      type: "workflow-replaced",
      workflowId: "new",
      validBreakpointKeys: validPooFlowBreakpointKeys(["keep"], ["new-edge"]),
    });

    expect(state.workflowId).toBe("new");
    expect(state.breakpoints).toEqual(new Set(["node:keep"]));
    expect(state.lastReceipt).toMatchObject({
      workflowId: "new",
      reason: "workflow-replaced",
      state: "ready",
    });
  });

  it("records completion and restores a deterministic filtered snapshot", () => {
    let state = createPooFlowDebuggerState("workflow");
    state = toggle(state, "edge", "b");
    state = toggle(state, "node", "a");
    state = transitionPooFlowDebugger(state, {
      type: "cursor-advanced",
      cursor: 3,
      stepCount: 3,
      source: "timer",
    });
    expect(state.lastReceipt).toMatchObject({ reason: "end", state: "complete" });

    const snapshot = snapshotPooFlowDebugger(state);
    expect(snapshot.breakpoints).toEqual(["edge:b", "node:a"]);
    const restored = restorePooFlowDebugger(snapshot, validPooFlowBreakpointKeys(["a"], []), 3);
    expect(restored).toMatchObject({ workflowId: "workflow", cursor: 3, playing: false });
    expect(restored.breakpoints).toEqual(new Set(["node:a"]));
  });
});
