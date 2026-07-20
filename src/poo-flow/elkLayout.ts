import ELK from "elkjs/lib/elk.bundled.js";

import type {
  PooFlowLayoutAdapter,
  PooFlowLayoutNodeGeometry,
  PooFlowLayoutNodeInput,
  PooFlowLayoutRequest,
} from "./layoutContract";

type ElkNode = {
  id: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  children?: ElkNode[];
  layoutOptions?: Record<string, string>;
};

const elk = new ELK();

function hierarchy(request: PooFlowLayoutRequest): ElkNode[] {
  const children = new Map<string | undefined, PooFlowLayoutNodeInput[]>();
  for (const node of request.nodes) {
    const siblings = children.get(node.parentId) ?? [];
    siblings.push(node);
    children.set(node.parentId, siblings);
  }

  const build = (node: PooFlowLayoutNodeInput): ElkNode => {
    const nested = (children.get(node.id) ?? []).map(build);
    return {
      id: node.id,
      width: node.container ? Math.max(node.width, 260) : node.width,
      height: node.container ? Math.max(node.height, 140) : node.height,
      children: nested.length > 0 ? nested : undefined,
      layoutOptions:
        nested.length > 0
          ? {
              "elk.algorithm": "layered",
              "elk.direction": request.direction,
              "elk.edgeRouting": "ORTHOGONAL",
              "elk.hierarchyHandling": "INCLUDE_CHILDREN",
              "elk.padding": `[top=${Math.ceil(node.height) + 24},left=18,bottom=18,right=18]`,
              "elk.spacing.nodeNode": "24",
              "elk.layered.spacing.nodeNodeBetweenLayers": "88",
            }
          : undefined,
    };
  };

  return (children.get(undefined) ?? []).map(build);
}

function flatten(
  nodes: readonly ElkNode[] | undefined,
  parentId: string | undefined,
  output: PooFlowLayoutNodeGeometry[],
  originX = 0,
  originY = 0,
) {
  for (const node of nodes ?? []) {
    const x = originX + (node.x ?? 0);
    const y = originY + (node.y ?? 0);
    output.push({
      id: node.id,
      parentId,
      x,
      y,
      width: node.width ?? 0,
      height: node.height ?? 0,
    });
    flatten(node.children, node.id, output, x, y);
  }
}

export const elkPooFlowLayout: PooFlowLayoutAdapter = {
  id: "elk-layered-compound-v1",
  async layout(request) {
    const graph = await elk.layout({
      id: "poo-flow-layout-root",
      layoutOptions: {
        "elk.algorithm": "layered",
        "elk.direction": request.direction,
        "elk.edgeRouting": "ORTHOGONAL",
        "elk.hierarchyHandling": "INCLUDE_CHILDREN",
        "elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
        "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
        "elk.layered.considerModelOrder.strategy": "NODES_AND_EDGES",
        "elk.layered.spacing.nodeNodeBetweenLayers": "144",
        "elk.layered.spacing.edgeNodeBetweenLayers": "32",
        "elk.spacing.edgeNode": "28",
        "elk.spacing.nodeNode": "40",
        "elk.padding": "[top=24,left=24,bottom=24,right=24]",
      },
      children: hierarchy(request),
      edges: request.connections.map((edge) => ({
        id: edge.id,
        sources: [edge.source],
        targets: [edge.target],
      })),
    });
    const nodes: PooFlowLayoutNodeGeometry[] = [];
    flatten(graph.children as ElkNode[] | undefined, undefined, nodes);
    return { nodes };
  },
};
