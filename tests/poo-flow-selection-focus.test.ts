import { describe, expect, it } from "vitest";

import {
  createPooFlowSelectionFocus,
  pooFlowEdgeFocusClass,
  pooFlowNodeFocusClass,
} from "../src/react/pooFlowSelectionFocus";

const nodes = [
  { id: "composition" },
  { id: "case", parentId: "composition" },
  { id: "profile", parentId: "case" },
  { id: "unrelated" },
];

const edges = [
  { id: "compose", source: "composition", target: "case" },
  { id: "handoff", source: "case", target: "profile" },
];

describe("POO Flow selection focus", () => {
  it("focuses a selected node, its direct route, and its semantic family", () => {
    const focus = createPooFlowSelectionFocus(nodes, edges, "case");

    expect([...focus!.nodeIds]).toEqual(["case", "composition", "profile"]);
    expect([...focus!.edgeIds]).toEqual(["compose", "handoff"]);
    expect(pooFlowNodeFocusClass(focus, "case")).toBe("poo-flow-node--focus");
    expect(pooFlowNodeFocusClass(focus, "profile")).toBe("poo-flow-node--related");
    expect(pooFlowNodeFocusClass(focus, "unrelated")).toBe("poo-flow-node--dimmed");
  });

  it("focuses the endpoints of a selected checkpoint", () => {
    const focus = createPooFlowSelectionFocus(nodes, edges, undefined, "handoff");

    expect(pooFlowEdgeFocusClass(focus, "handoff")).toBe("poo-flow-edge--focus");
    expect(pooFlowEdgeFocusClass(focus, "compose")).toBe("poo-flow-edge--dimmed");
    expect(focus!.nodeIds.has("case")).toBe(true);
    expect(focus!.nodeIds.has("profile")).toBe(true);
  });

  it("does not add visual focus when nothing is selected", () => {
    const focus = createPooFlowSelectionFocus(nodes, edges);

    expect(focus).toBeUndefined();
    expect(pooFlowNodeFocusClass(focus, "case")).toBeUndefined();
    expect(pooFlowEdgeFocusClass(focus, "compose")).toBeUndefined();
  });
});
