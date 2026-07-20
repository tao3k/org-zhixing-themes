import {
  workflow,
  workflowTopology,
} from "@poo-flow/runtime-wasm/workflows/browser-profile-composition";
import { describe, expect, it } from "vitest";

import { pooFlowWorkflowIds } from "../src/react/pooFlowWasmRunner";

describe("POO Flow User Composition projection", () => {
  it("publishes recursive Case and Profile instances through the package boundary", () => {
    expect(pooFlowWorkflowIds).toContain("browser-profile-composition");
    expect(workflow.rootId).toBe("composition:browser-profile-composition");
    expect(Array.from(workflowTopology)).toEqual([1, 8, 7]);

    const nestedCase = workflow.steps.find(
      (node) => node.id === "case:real-scenario/research-case",
    );
    expect(nestedCase).toMatchObject({
      kind: "case",
      parentId: "case:real-scenario",
      sourceId: "case-definition:research-case",
    });

    const evidenceInstances = workflow.steps.filter(
      (node) => node.sourceId === "profile:research/evidence-curator",
    );
    expect(evidenceInstances).toHaveLength(2);
    expect(new Set(evidenceInstances.map((node) => node.parentId)).size).toBe(2);
  });
});
