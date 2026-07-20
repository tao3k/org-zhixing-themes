import { describe, expect, it } from "vitest";

import { elkPooFlowLayout } from "../src/poo-flow/elkLayout";

describe("POO Flow ELK layout adapter", () => {
  it("returns absolute compound geometry without renderer types", async () => {
    const result = await elkPooFlowLayout.layout({
      direction: "DOWN",
      nodes: [
        { id: "composition", width: 320, height: 190, container: true },
        {
          id: "case",
          parentId: "composition",
          width: 320,
          height: 190,
          container: true,
        },
        {
          id: "profile-a",
          parentId: "case",
          width: 268,
          height: 118,
          container: false,
        },
        {
          id: "profile-b",
          parentId: "case",
          width: 268,
          height: 118,
          container: false,
        },
      ],
      connections: [
        { id: "composition-case", source: "composition", target: "case" },
        { id: "profile-flow", source: "profile-a", target: "profile-b" },
      ],
    });

    const composition = result.nodes.find(({ id }) => id === "composition");
    const childCase = result.nodes.find(({ id }) => id === "case");
    const profile = result.nodes.find(({ id }) => id === "profile-a");
    expect(composition?.width).toBeGreaterThan(320);
    expect(childCase).toMatchObject({ parentId: "composition" });
    expect(profile).toMatchObject({ parentId: "case", width: 268, height: 118 });
    expect(childCase!.y - composition!.y).toBeGreaterThanOrEqual(214);
    expect(profile!.y - childCase!.y).toBeGreaterThanOrEqual(214);
    expect(result.nodes.every((node) => Number.isFinite(node.x) && Number.isFinite(node.y))).toBe(
      true,
    );
    expect(JSON.stringify(result)).not.toContain("react-flow");
  });

  it("keeps Subagent Workflow and Funflow compounds deterministic and contained", async () => {
    const request = {
      direction: "DOWN" as const,
      nodes: [
        { id: "subagent-workflow", width: 320, height: 190, container: true },
        {
          id: "subagent-coordinator",
          parentId: "subagent-workflow",
          width: 268,
          height: 118,
          container: false,
        },
        {
          id: "subagent-worker",
          parentId: "subagent-workflow",
          width: 268,
          height: 118,
          container: false,
        },
        { id: "funflow", width: 320, height: 190, container: true },
        {
          id: "funflow-ingress",
          parentId: "funflow",
          width: 268,
          height: 118,
          container: false,
        },
        {
          id: "funflow-transform",
          parentId: "funflow",
          width: 268,
          height: 118,
          container: false,
        },
      ],
      connections: [
        {
          id: "subagent-sequence",
          source: "subagent-coordinator",
          target: "subagent-worker",
        },
        { id: "scenario-handoff", source: "subagent-workflow", target: "funflow" },
        { id: "funflow-sequence", source: "funflow-ingress", target: "funflow-transform" },
      ],
    };

    const first = await elkPooFlowLayout.layout(request);
    const second = await elkPooFlowLayout.layout(request);
    expect(second).toEqual(first);

    const geometry = new Map(first.nodes.map((node) => [node.id, node]));
    for (const childId of [
      "subagent-coordinator",
      "subagent-worker",
      "funflow-ingress",
      "funflow-transform",
    ]) {
      const child = geometry.get(childId);
      const parent = child?.parentId ? geometry.get(child.parentId) : undefined;
      expect(child).toBeDefined();
      expect(parent).toBeDefined();
      expect(child!.x).toBeGreaterThanOrEqual(parent!.x);
      expect(child!.y).toBeGreaterThanOrEqual(parent!.y);
      expect(child!.y - parent!.y).toBeGreaterThanOrEqual(214);
      expect(child!.x + child!.width).toBeLessThanOrEqual(parent!.x + parent!.width);
      expect(child!.y + child!.height).toBeLessThanOrEqual(parent!.y + parent!.height);
    }

    expect(geometry.get("subagent-worker")!.y).toBeGreaterThan(
      geometry.get("subagent-coordinator")!.y,
    );
    expect(geometry.get("funflow-transform")!.y).toBeGreaterThan(
      geometry.get("funflow-ingress")!.y,
    );
    expect(geometry.get("funflow")!.y).toBeGreaterThan(geometry.get("subagent-workflow")!.y);
  });

  it.each(["DOWN", "RIGHT"] as const)(
    "reserves facet-sized container chrome in %s layouts",
    async (direction) => {
      const result = await elkPooFlowLayout.layout({
        direction,
        nodes: [
          { id: "facet-container", width: 268, height: 168, container: true },
          {
            id: "facet-child",
            parentId: "facet-container",
            width: 250,
            height: 104,
            container: false,
          },
        ],
        connections: [],
      });
      const container = result.nodes.find(({ id }) => id === "facet-container")!;
      const child = result.nodes.find(({ id }) => id === "facet-child")!;

      expect(child.parentId).toBe(container.id);
      expect(child.y - container.y).toBeGreaterThanOrEqual(192);
      expect(child.x).toBeGreaterThanOrEqual(container.x);
      expect(child.x + child.width).toBeLessThanOrEqual(container.x + container.width);
      expect(child.y + child.height).toBeLessThanOrEqual(container.y + container.height);
    },
  );
});
