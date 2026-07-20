export interface PooFlowVisibilityNode {
  readonly id: string;
  readonly parentId?: string;
}

export interface PooFlowFacetVisibility {
  readonly capabilities: boolean;
  readonly properties: boolean;
  readonly states: boolean;
  readonly condition: boolean;
}

export type PooFlowZoomTier = "overview" | "condition" | "states" | "properties" | "detail";

export function hiddenPooFlowNodeIds(
  nodes: readonly PooFlowVisibilityNode[],
  collapsedNodeIds: ReadonlySet<string>,
): ReadonlySet<string> {
  if (collapsedNodeIds.size === 0) return new Set<string>();

  const hidden = new Set<string>();
  let changed = true;
  while (changed) {
    changed = false;
    for (const node of nodes) {
      if (
        node.parentId &&
        !hidden.has(node.id) &&
        (collapsedNodeIds.has(node.parentId) || hidden.has(node.parentId))
      ) {
        hidden.add(node.id);
        changed = true;
      }
    }
  }
  return hidden;
}

export function pooFlowFacetVisibility(zoom: number): PooFlowFacetVisibility {
  return {
    capabilities: zoom >= 0.92,
    properties: zoom >= 0.78,
    states: zoom >= 0.62,
    condition: zoom >= 0.52,
  };
}

export function pooFlowZoomTier(zoom: number): PooFlowZoomTier {
  if (zoom < 0.52) return "overview";
  if (zoom < 0.62) return "condition";
  if (zoom < 0.78) return "states";
  if (zoom < 0.92) return "properties";
  return "detail";
}
