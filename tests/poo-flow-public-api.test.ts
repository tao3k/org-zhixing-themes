import { describe, expect, it } from "vitest";

import {
  POO_FLOW_TOPOLOGY_INTENT_SCHEMA,
  elkPooFlowLayout,
  executePooFlowTopologyMutation,
  transitionPooFlowDebugger,
} from "org-zhixing/poo-flow";

describe("POO Flow public subpath", () => {
  it("exports React-free graph, layout, debugger, and topology contracts", () => {
    expect(elkPooFlowLayout.id).toBe("elk-layered-compound-v1");
    expect(transitionPooFlowDebugger).toBeTypeOf("function");
    expect(executePooFlowTopologyMutation).toBeTypeOf("function");
    expect(POO_FLOW_TOPOLOGY_INTENT_SCHEMA).toBe("poo-flow.graph-topology-intent.v1");
  });
});
