import { describe, expect, it } from "vitest";

import { createPooFlowGraphProjection } from "../src/poo-flow/graphContract";

describe("POO Flow stateful object projection", () => {
  it("preserves conditions, layered properties, capabilities, and assurance state", () => {
    const projection = createPooFlowGraphProjection("stateful-profile", {
      rootId: "researcher",
      events: [
        {
          id: "researcher",
          label: "Researcher",
          kind: "profile-instance",
          objectForm: "instance",
          objectSubtype: "human-researcher",
          definitionId: "profile/researcher",
          instanceId: "profile/researcher#browser-lab",
          capabilities: ["curate-evidence", "qualify-source"],
          conditions: [
            {
              id: "source-qualified",
              kind: "precondition",
              expression: "source.assurance >= reviewed",
              state: "satisfied",
              label: "Source qualified",
            },
          ],
          properties: {
            definition: { role: "researcher", reviewRequired: true },
            inherited: { policy: "evidence-first" },
            instance: { workspace: "browser-lab" },
          },
          states: [
            {
              layer: "instance",
              name: "availability",
              value: "ready",
              tone: "active",
            },
            {
              layer: "assurance",
              name: "qualification",
              value: "verified",
              tone: "success",
            },
          ],
        },
      ],
    });

    expect(projection.nodes[0]).toMatchObject({
      capabilities: ["curate-evidence", "qualify-source"],
      conditions: [{ id: "source-qualified", state: "satisfied" }],
      properties: {
        definition: { role: "researcher", reviewRequired: true },
        inherited: { policy: "evidence-first" },
        instance: { workspace: "browser-lab" },
      },
      states: [
        { layer: "instance", name: "availability", value: "ready" },
        { layer: "assurance", name: "qualification", value: "verified" },
      ],
    });
  });
});
