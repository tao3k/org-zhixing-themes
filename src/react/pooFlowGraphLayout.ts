import { MarkerType, Position } from "@xyflow/react";
import {
  type PooFlowGraphNode as SemanticPooFlowNode,
  type PooFlowGraphProjection,
} from "../poo-flow/graphContract";
import { pooFlowNativeParentId } from "../poo-flow/graphWorkbench";
import { elkPooFlowLayout } from "../poo-flow/elkLayout";
import type { PooFlowGraphEdge, PooFlowGraphNode } from "./PooFlowGraphRenderers";
import { getPooFlowNodePresentation } from "./pooFlowNodePresentation";

const nodeWidth = 268;
const nodeHeight = 118;

export function toNodes(events: readonly SemanticPooFlowNode[]): PooFlowGraphNode[] {
  const childCounts = new Map<string, number>();
  events.forEach((event) => {
    if (event.parentId) childCounts.set(event.parentId, (childCounts.get(event.parentId) ?? 0) + 1);
  });
  const nodesById = new Map(events.map((event) => [event.id, event]));
  return events.map((event, index) => ({
    id: event.id,
    type: event.kind,
    parentId: pooFlowNativeParentId(event, nodesById),
    deletable: false,
    position: { x: 0, y: 0 },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    className: `poo-flow-node poo-flow-node--${event.kind ?? "step"} poo-flow-node--pending`,
    style: getPooFlowNodePresentation(event.kind, event),
    data: {
      event,
      state: "pending",
      index,
      eventCount: events.length,
      childCount: childCounts.get(event.id) ?? 0,
      collapsed: false,
      onToggleCollapse: () => undefined,
      breakpoint: false,
      mode: "explore",
      onToggleBreakpoint: () => undefined,
      onRunTo: () => undefined,
    },
  }));
}

export function toEdges(projection: PooFlowGraphProjection): PooFlowGraphEdge[] {
  return projection.connections.map((edge) => ({
    id: edge.id,
    type: "poo-flow",
    source: edge.source,
    target: edge.target,
    deletable: false,
    data: { relation: edge.relation },
    markerEnd: { type: MarkerType.ArrowClosed },
    animated: false,
  }));
}

export type PooFlowLayoutDirection = "RIGHT" | "DOWN";

export function responsiveLayoutDirection(): PooFlowLayoutDirection {
  return typeof window !== "undefined" && window.matchMedia("(max-width: 720px)").matches
    ? "DOWN"
    : "RIGHT";
}

export async function layout(
  nodes: PooFlowGraphNode[],
  edges: PooFlowGraphEdge[],
  direction: PooFlowLayoutDirection = "RIGHT",
): Promise<PooFlowGraphNode[]> {
  const graph = await elkPooFlowLayout.layout({
    direction,
    nodes: nodes.map((node) => ({
      id: node.id,
      parentId: node.parentId,
      ...getPooFlowNodePresentation(node.data.event.kind, node.data.event),
      container: nodes.some((candidate) => candidate.parentId === node.id),
    })),
    connections: edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
    })),
  });
  const positions = new Map(graph.nodes.map((node) => [node.id, node]));
  const relativePositions = new Map(
    [...positions.entries()].map(([id, geometry]) => {
      const node = nodes.find((candidate) => candidate.id === id);
      const parent = node?.parentId ? positions.get(node.parentId) : undefined;
      return [
        id,
        {
          ...geometry,
          x: geometry.x - (parent?.x ?? 0),
          y: geometry.y - (parent?.y ?? 0),
        },
      ] as const;
    }),
  );
  return nodes.map((node) => {
    const position = relativePositions.get(node.id);
    return {
      ...node,
      position: { x: position?.x ?? 0, y: position?.y ?? 0 },
      style: {
        width: position?.width ?? node.style?.width ?? nodeWidth,
        height: position?.height ?? node.style?.height ?? nodeHeight,
      },
    };
  });
}
