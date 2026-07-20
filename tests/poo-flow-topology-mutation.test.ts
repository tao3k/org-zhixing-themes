import { describe, expect, it } from "vitest";
import {
  executePooFlowTopologyMutation,
  POO_FLOW_TOPOLOGY_INTENT_SCHEMA,
  POO_FLOW_TOPOLOGY_RECEIPT_SCHEMA,
  type PooFlowTopologyIntent,
  type PooFlowTopologyMutationAdapter,
  type PooFlowTopologyProjection,
} from "../src/poo-flow/topologyMutation";

const intent = (operation: PooFlowTopologyIntent["operation"]): PooFlowTopologyIntent => ({
  schema: POO_FLOW_TOPOLOGY_INTENT_SCHEMA,
  intentId: `intent-${operation.kind}`,
  workflowId: "workflow-1",
  expectedRevision: "r1",
  operation,
});

const projection = (): PooFlowTopologyProjection => ({
  workflowId: "workflow-1",
  revision: "r1",
  nodes: [{ id: "a" }, { id: "b" }, { id: "c" }],
  edges: [{ id: "a-b", source: "a", target: "b" }],
});

describe("POO Flow typed topology mutation adapter", () => {
  it("applies, reloads, and verifies a connect round trip", async () => {
    let current = projection();
    const adapter: PooFlowTopologyMutationAdapter = {
      capabilities: { connect: true, disconnect: true, reconnect: true },
      reload: async () => current,
      apply: async (request) => {
        const operation = request.operation;
        expect(operation.kind).toBe("connect");
        if (operation.kind === "connect") {
          current = {
            ...current,
            revision: "r2",
            edges: [
              ...current.edges,
              { id: operation.edgeId, source: operation.source, target: operation.target },
            ],
          };
        }
        return {
          schema: POO_FLOW_TOPOLOGY_RECEIPT_SCHEMA,
          intentId: request.intentId,
          workflowId: request.workflowId,
          status: "applied",
          revision: "r2",
          reason: "applied",
        };
      },
    };
    const result = await executePooFlowTopologyMutation(
      adapter,
      intent({ kind: "connect", edgeId: "b-c", source: "b", target: "c" }),
    );
    expect(result.receipt).toMatchObject({ status: "applied", revision: "r2" });
    expect(result.projection?.edges).toHaveLength(2);
  });

  it("fails closed when a capability is unavailable", async () => {
    let applyCount = 0;
    const adapter: PooFlowTopologyMutationAdapter = {
      capabilities: { connect: false, disconnect: false, reconnect: false },
      reload: async () => projection(),
      apply: async () => {
        applyCount += 1;
        throw new Error("must not apply");
      },
    };
    const result = await executePooFlowTopologyMutation(
      adapter,
      intent({ kind: "connect", edgeId: "b-c", source: "b", target: "c" }),
    );
    expect(result.receipt.reason).toBe("capability-unavailable");
    expect(applyCount).toBe(0);
  });

  it("rejects revision conflicts before applying", async () => {
    const request = intent({ kind: "disconnect", edgeId: "a-b" });
    request.expectedRevision = "stale";
    const adapter: PooFlowTopologyMutationAdapter = {
      capabilities: { connect: true, disconnect: true, reconnect: true },
      reload: async () => projection(),
      apply: async () => {
        throw new Error("must not apply");
      },
    };
    const result = await executePooFlowTopologyMutation(adapter, request);
    expect(result.receipt.reason).toBe("revision-conflict");
  });

  it("rejects malformed post-apply topology instead of trusting an adapter", async () => {
    let applied = false;
    const adapter: PooFlowTopologyMutationAdapter = {
      capabilities: { connect: true, disconnect: true, reconnect: true },
      reload: async () =>
        applied
          ? {
              ...projection(),
              revision: "r2",
              edges: [{ id: "broken", source: "missing", target: "b" }],
            }
          : projection(),
      apply: async (request) => {
        applied = true;
        return {
          schema: POO_FLOW_TOPOLOGY_RECEIPT_SCHEMA,
          intentId: request.intentId,
          workflowId: request.workflowId,
          status: "applied",
          revision: "r2",
          reason: "applied",
        };
      },
    };
    const result = await executePooFlowTopologyMutation(
      adapter,
      intent({ kind: "connect", edgeId: "b-c", source: "b", target: "c" }),
    );
    expect(result.receipt.reason).toBe("invalid-reload");
    expect(result.projection).toBeUndefined();
  });

  it("turns adapter failures into a structured rejection receipt", async () => {
    const adapter: PooFlowTopologyMutationAdapter = {
      capabilities: { connect: true, disconnect: true, reconnect: true },
      reload: async () => projection(),
      apply: async () => {
        throw new Error("runtime rejected mutation");
      },
    };
    const result = await executePooFlowTopologyMutation(
      adapter,
      intent({ kind: "connect", edgeId: "b-c", source: "b", target: "c" }),
    );
    expect(result.receipt).toMatchObject({
      status: "rejected",
      reason: "adapter-rejected",
      detail: "runtime rejected mutation",
    });
  });
});
