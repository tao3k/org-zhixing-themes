import { describe, expect, it } from "vitest";

import { advancePooFlowCursor, pooFlowExecutionState } from "../src/react/pooFlowModel";

describe("Poo Flow execution cursor", () => {
  it("projects pending, running, and completed states in event order", () => {
    expect([0, 1, 2, 3].map((index) => pooFlowExecutionState(index, -1, 4))).toEqual([
      "pending",
      "pending",
      "pending",
      "pending",
    ]);
    expect([0, 1, 2, 3].map((index) => pooFlowExecutionState(index, 2, 4))).toEqual([
      "completed",
      "completed",
      "running",
      "pending",
    ]);
    expect([0, 1, 2, 3].map((index) => pooFlowExecutionState(index, 4, 4))).toEqual([
      "completed",
      "completed",
      "completed",
      "completed",
    ]);
  });

  it("advances one step and stops at the workflow boundary", () => {
    expect(advancePooFlowCursor(-1, 4)).toBe(0);
    expect(advancePooFlowCursor(2, 4)).toBe(3);
    expect(advancePooFlowCursor(4, 4)).toBe(4);
  });
});
