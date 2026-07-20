import { describe, expect, it } from "vitest";

import {
  hiddenPooFlowNodeIds,
  pooFlowFacetVisibility,
  pooFlowZoomTier,
} from "../src/react/pooFlowVisibility";

describe("POO Flow flat semantic visibility", () => {
  it("hides every descendant without creating nested renderer nodes", () => {
    const hidden = hiddenPooFlowNodeIds(
      [
        { id: "composition" },
        { id: "case", parentId: "composition" },
        { id: "nested-case", parentId: "case" },
        { id: "profile", parentId: "nested-case" },
        { id: "sibling", parentId: "composition" },
      ],
      new Set(["case"]),
    );

    expect([...hidden]).toEqual(["nested-case", "profile"]);
  });

  it("progressively removes secondary facets as the viewport zooms out", () => {
    expect(pooFlowFacetVisibility(1)).toEqual({
      capabilities: true,
      properties: true,
      states: true,
      condition: true,
    });
    expect(pooFlowFacetVisibility(0.7)).toEqual({
      capabilities: false,
      properties: false,
      states: true,
      condition: true,
    });
    expect(pooFlowFacetVisibility(0.45)).toEqual({
      capabilities: false,
      properties: false,
      states: false,
      condition: false,
    });
    expect([0.45, 0.55, 0.7, 0.82, 1].map(pooFlowZoomTier)).toEqual([
      "overview",
      "condition",
      "states",
      "properties",
      "detail",
    ]);
  });
});
