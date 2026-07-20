import { describe, expect, it } from "vitest";
import { getPooFlowNodePresentation } from "../src/react/pooFlowNodePresentation";

describe("POO Flow stateful node presentation", () => {
  it("reserves graph layout space for projected state and properties", () => {
    const base = getPooFlowNodePresentation("profile-instance");
    const stateful = getPooFlowNodePresentation("profile-instance", {
      capabilities: ["qualify-evidence"],
      properties: {
        inherited: { policy: "research" },
        instance: { retries: 2 },
      },
      states: [
        {
          layer: "instance",
          name: "readiness",
          value: "qualified",
          tone: "success",
        },
      ],
    });

    expect(stateful.width).toBe(base.width);
    expect(stateful.height).toBeGreaterThan(base.height);
  });
});
