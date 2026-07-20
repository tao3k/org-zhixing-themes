export interface PooFlowFocusableNode {
  id: string;
  parentId?: string;
}

export interface PooFlowFocusableEdge {
  id: string;
  source: string;
  target: string;
}

export interface PooFlowSelectionFocus {
  selectedNodeId?: string;
  selectedEdgeId?: string;
  nodeIds: ReadonlySet<string>;
  edgeIds: ReadonlySet<string>;
}

export function createPooFlowSelectionFocus(
  nodes: readonly PooFlowFocusableNode[],
  edges: readonly PooFlowFocusableEdge[],
  selectedNodeId?: string,
  selectedEdgeId?: string,
): PooFlowSelectionFocus | undefined {
  return collectPooFlowSelectionFocus(nodes, edges, selectedNodeId, selectedEdgeId);
}

function collectPooFlowSelectionFocus(
  nodes: readonly PooFlowFocusableNode[],
  edges: readonly PooFlowFocusableEdge[],
  selectedNodeId?: string,
  selectedEdgeId?: string,
): PooFlowSelectionFocus | undefined {
  if (!selectedNodeId && !selectedEdgeId) {
    return undefined;
  }

  const nodeIds = new Set<string>();
  const edgeIds = new Set<string>();
  const nodesById = new Map(nodes.map((node) => [node.id, node]));

  const includeNodeFamily = (nodeId: string) => {
    nodeIds.add(nodeId);
    const parentId = nodesById.get(nodeId)?.parentId;
    if (parentId) {
      nodeIds.add(parentId);
    }
    for (const node of nodes) {
      if (node.parentId === nodeId) {
        nodeIds.add(node.id);
      }
    }
  };

  if (selectedNodeId) {
    includeNodeFamily(selectedNodeId);
    for (const edge of edges) {
      if (edge.source !== selectedNodeId && edge.target !== selectedNodeId) {
        continue;
      }
      edgeIds.add(edge.id);
      includeNodeFamily(edge.source);
      includeNodeFamily(edge.target);
    }
  }

  if (selectedEdgeId) {
    const selectedEdge = edges.find((edge) => edge.id === selectedEdgeId);
    if (selectedEdge) {
      edgeIds.add(selectedEdge.id);
      includeNodeFamily(selectedEdge.source);
      includeNodeFamily(selectedEdge.target);
    }
  }

  return {
    selectedNodeId,
    selectedEdgeId,
    nodeIds,
    edgeIds,
  };
}

export function pooFlowNodeFocusClass(
  focus: PooFlowSelectionFocus | undefined,
  nodeId: string,
): string | undefined {
  if (!focus) {
    return undefined;
  }
  if (focus.selectedNodeId === nodeId) {
    return "poo-flow-node--focus";
  }
  return focus.nodeIds.has(nodeId) ? "poo-flow-node--related" : "poo-flow-node--dimmed";
}

export function pooFlowEdgeFocusClass(
  focus: PooFlowSelectionFocus | undefined,
  edgeId: string,
): string | undefined {
  if (!focus) {
    return undefined;
  }
  if (focus.selectedEdgeId === edgeId) {
    return "poo-flow-edge--focus";
  }
  return focus.edgeIds.has(edgeId) ? "poo-flow-edge--related" : "poo-flow-edge--dimmed";
}
