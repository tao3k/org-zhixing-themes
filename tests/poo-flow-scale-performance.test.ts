import { performance } from "node:perf_hooks";

import { describe, expect, it } from "vitest";

import { createPooFlowGraphProjection } from "../src/poo-flow/graphContract";
import { elkPooFlowLayout } from "../src/poo-flow/elkLayout";
import type { PooFlowLayoutNodeInput } from "../src/poo-flow/layoutContract";
import { hiddenPooFlowNodeIds } from "../src/react/pooFlowVisibility";

const SCALE_BUDGETS = [
  { nodes: 8, budgetMs: 5 },
  { nodes: 50, budgetMs: 8 },
  { nodes: 200, budgetMs: 20 },
  { nodes: 1_000, budgetMs: 80 },
] as const;

const ELK_SCALE_BUDGETS = [
  { nodes: 50, coldBudgetMs: 500, warmBudgetMs: 350 },
  { nodes: 200, coldBudgetMs: 1_800, warmBudgetMs: 1_200 },
  { nodes: 1_000, coldBudgetMs: 9_000, warmBudgetMs: 6_000 },
] as const;

function scaleFixture(size: number) {
  return {
    rootId: "composition:scale",
    events: Array.from({ length: size }, (_, index) => ({
      id: index === 0 ? "composition:scale" : `profile:${index}`,
      label: index === 0 ? "Scale composition" : `Profile ${index}`,
      kind: index === 0 ? "composition" : "profile-instance",
      parentId: index === 0 ? undefined : "composition:scale",
      relation: index === 0 ? "root" : "step",
      objectSubtype: index === 0 ? undefined : "agent",
      scope: index === 0 ? undefined : "benchmark",
      capabilities: index === 0 ? [] : ["observe", "run"],
    })),
    edges: Array.from({ length: size - 1 }, (_, index) => ({
      source: "composition:scale",
      target: `profile:${index + 1}`,
      label: "step",
    })),
  } as const;
}

function layoutFixture(size: number, compound: boolean) {
  if (!compound) {
    return {
      direction: "RIGHT" as const,
      nodes: Array.from({ length: size }, (_, index) => ({
        id: `node:${index}`,
        width: 196,
        height: 80,
        container: false,
      })),
      connections: Array.from({ length: size - 1 }, (_, index) => ({
        id: `edge:${index}`,
        source: `node:${index}`,
        target: `node:${index + 1}`,
      })),
    };
  }

  const nodes: PooFlowLayoutNodeInput[] = [
    { id: "scenario:scale", width: 268, height: 168, container: true },
  ];
  const connections: { id: string; source: string; target: string }[] = [];
  let groupId = "";
  let previousMemberId = "";
  for (let index = 1; index < size; index += 1) {
    if ((index - 1) % 10 === 0) {
      groupId = `case:${index}`;
      previousMemberId = "";
      nodes.push({
        id: groupId,
        parentId: "scenario:scale",
        width: 260,
        height: 168,
        container: true,
      });
      connections.push({
        id: `scenario:${groupId}`,
        source: "scenario:scale",
        target: groupId,
      });
      continue;
    }
    const memberId = `profile:${index}`;
    nodes.push({
      id: memberId,
      parentId: groupId,
      width: 250,
      height: 104,
      container: false,
    });
    if (previousMemberId) {
      connections.push({
        id: `${previousMemberId}:${memberId}`,
        source: previousMemberId,
        target: memberId,
      });
    }
    previousMemberId = memberId;
  }
  return { direction: "DOWN" as const, nodes, connections };
}

describe("POO Flow scale scenario benchmark", () => {
  for (const { nodes, budgetMs } of SCALE_BUDGETS) {
    it(`${nodes} nodes project and collapse within ${budgetMs}ms`, () => {
      const fixture = scaleFixture(nodes);
      createPooFlowGraphProjection(`warm-${nodes}`, fixture);

      const samples = Array.from({ length: 7 }, (_, sample) => {
        const startedAt = performance.now();
        const graph = createPooFlowGraphProjection(`scale-${nodes}-${sample}`, fixture);
        const hidden = hiddenPooFlowNodeIds(graph.nodes, new Set(["composition:scale"]));
        expect(hidden.size).toBe(nodes - 1);
        return performance.now() - startedAt;
      }).sort((left, right) => left - right);

      expect(samples[Math.floor(samples.length / 2)]).toBeLessThan(budgetMs);
    });
  }

  for (const compound of [false, true]) {
    for (const { nodes, coldBudgetMs, warmBudgetMs } of ELK_SCALE_BUDGETS) {
      it(`${nodes} ${compound ? "compound" : "flat"} nodes keep ELK cold and warm layout inside budget`, async () => {
        const fixture = layoutFixture(nodes, compound);
        const coldStartedAt = performance.now();
        const cold = await elkPooFlowLayout.layout(fixture);
        const coldDuration = performance.now() - coldStartedAt;

        const warmSamples: number[] = [];
        let warm = cold;
        for (let sample = 0; sample < 3; sample += 1) {
          const warmStartedAt = performance.now();
          warm = await elkPooFlowLayout.layout(fixture);
          warmSamples.push(performance.now() - warmStartedAt);
        }
        warmSamples.sort((left, right) => left - right);

        expect(cold.nodes).toHaveLength(nodes);
        expect(warm).toEqual(cold);
        expect(coldDuration).toBeLessThan(coldBudgetMs);
        expect(warmSamples[1]).toBeLessThan(warmBudgetMs);
      }, 30_000);
    }
  }
});
