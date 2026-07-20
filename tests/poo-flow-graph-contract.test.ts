import { describe, expect, it } from "vitest";

import { createPooFlowGraphProjection, pooFlowWorkflowId } from "../src/poo-flow/graphContract";

describe("POO Flow Graph IFC", () => {
  const composition = {
    rootId: "composition:demo",
    events: [
      { id: "composition:demo", label: "Demo", kind: "composition", relation: "compose" },
      {
        id: "case:research",
        label: "Research",
        kind: "case",
        parentId: "composition:demo",
        relation: "compose",
      },
      {
        id: "profile:researcher",
        label: "Researcher",
        kind: "profile-instance",
        parentId: "case:research",
        sourceId: "profile:research/researcher",
        relation: "step",
        objectSubtype: "agent",
        scope: "research",
        capabilities: ["discover", "synthesize"],
      },
    ],
    edges: [
      { source: "composition:demo", target: "case:research", label: "compose" },
      { source: "case:research", target: "profile:researcher", label: "step" },
    ],
  } as const;

  it("projects identity, containment, ports, and typed relations without renderer types", () => {
    const graph = createPooFlowGraphProjection("demo", composition);
    expect(graph.schemaVersion).toBe(1);
    expect(graph.rootIds).toEqual(["composition:demo"]);
    expect(graph.nodes[2]).toMatchObject({
      parentId: "case:research",
      sourceId: "profile:research/researcher",
      relation: "step",
      objectSubtype: "agent",
      scope: "research",
      capabilities: ["discover", "synthesize"],
      ports: { input: "in", output: "out" },
    });
    expect(graph.connections.map(({ relation }) => relation)).toEqual(["compose", "step"]);
    expect(JSON.stringify(graph)).not.toContain("react-flow");
  });

  it("rejects duplicate nodes, dangling containment, dangling edges, and cycles", () => {
    expect(() =>
      createPooFlowGraphProjection("demo", {
        events: [composition.events[0], composition.events[0]],
      }),
    ).toThrow("POO-GRAPH-E005");
    expect(() =>
      createPooFlowGraphProjection("demo", {
        events: [{ ...composition.events[1], parentId: "case:missing" }],
      }),
    ).toThrow("POO-GRAPH-E006");
    expect(() =>
      createPooFlowGraphProjection("demo", {
        events: [composition.events[0]],
        edges: [{ source: "composition:demo", target: "missing" }],
      }),
    ).toThrow("POO-GRAPH-E008");
    expect(() =>
      createPooFlowGraphProjection("demo", {
        events: [
          { id: "a", label: "A", parentId: "b" },
          { id: "b", label: "B", parentId: "a" },
        ],
      }),
    ).toThrow("POO-GRAPH-E007");
  });

  it("makes workflow identity explicit and rejects accidental free text", () => {
    expect(pooFlowWorkflowId("browser-profile-composition")).toBe("browser-profile-composition");
    expect(() => pooFlowWorkflowId("not a workflow id")).toThrow("POO-GRAPH-E002");
  });
});
