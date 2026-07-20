import { describe, expect, it } from "vitest";
import { createPooFlowGraphProjection } from "../src/poo-flow/graphContract";
import {
  hasPooFlowBreakpoint,
  pooFlowGraphInteractionPolicy,
  pooFlowNativeParentId,
  togglePooFlowBreakpoint,
} from "../src/poo-flow/graphWorkbench";

describe("POO Flow graph workbench policy", () => {
  it("fails closed outside an available typed Scheme mutation path", () => {
    for (const mode of ["explore", "run", "compose"] as const) {
      const policy = pooFlowGraphInteractionPolicy(mode);
      expect(policy.nodesDraggable).toBe(true);
      expect(policy.nodesConnectable).toBe(false);
      expect(policy.edgesReconnectable).toBe(false);
      expect(policy.elementsDeletable).toBe(false);
      expect(policy.deleteKeyCode).toBeNull();
    }
  });

  it("enables connection intents only in compose mode with a typed adapter", () => {
    expect(
      pooFlowGraphInteractionPolicy("compose", { typedTopologyMutations: true }),
    ).toMatchObject({
      nodesConnectable: true,
      edgesReconnectable: true,
      topologyIntentControlsVisible: true,
    });
    expect(pooFlowGraphInteractionPolicy("run", { typedTopologyMutations: true })).toMatchObject({
      nodesConnectable: false,
      runtimeControlsVisible: true,
    });
  });

  it("tracks node and edge breakpoints without conflating their ids", () => {
    const node = { kind: "node", id: "checkpoint" } as const;
    const edge = { kind: "edge", id: "checkpoint" } as const;
    const withNode = togglePooFlowBreakpoint(new Set(), node);
    const withBoth = togglePooFlowBreakpoint(withNode, edge);
    expect(hasPooFlowBreakpoint(withBoth, node)).toBe(true);
    expect(hasPooFlowBreakpoint(withBoth, edge)).toBe(true);
    expect(hasPooFlowBreakpoint(togglePooFlowBreakpoint(withBoth, node), node)).toBe(false);
  });

  it("uses native parentId only for declared compound workflow scenarios", () => {
    const nodes = new Map([
      ["flat", { id: "flat", scenario: "composition" }],
      ["agents", { id: "agents", scenario: "subagent-workflow" }],
      ["fun", { id: "fun", scenario: "funflow" }],
    ]);
    expect(pooFlowNativeParentId({ id: "profile", parentId: "flat" }, nodes)).toBeUndefined();
    expect(pooFlowNativeParentId({ id: "worker", parentId: "agents" }, nodes)).toBe("agents");
    expect(pooFlowNativeParentId({ id: "continuation", parentId: "fun" }, nodes)).toBe("fun");
  });

  it("preserves a structured subflow scenario through the graph contract", () => {
    const projection = createPooFlowGraphProjection("subagents", {
      events: [
        {
          id: "team",
          label: "Agent team",
          kind: "composition",
          scenario: "subagent-workflow",
        },
        {
          id: "worker",
          label: "Worker",
          kind: "profile-instance",
          parentId: "team",
        },
      ],
    });
    expect(projection.nodes[0]?.scenario).toBe("subagent-workflow");
    expect(projection.nodes[1]?.parentId).toBe("team");
  });
});
