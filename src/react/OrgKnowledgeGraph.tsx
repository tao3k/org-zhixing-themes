import Graph from "graphology";
import { formatRgb, parse } from "culori";
import { gsap } from "gsap";
import { useEffect, useRef, useState, type ReactNode } from "react";

export type KnowledgeGraphNode = {
  id: string;
  label: string;
  parentId: string;
  rangeStart: number | null;
  role: "ancestor" | "context" | "current" | "distant" | "root" | "source";
  overview?: boolean;
  sourceFile?: string;
  tags: readonly string[];
  todo: string | null;
  x: number;
  y: number;
};

export type KnowledgeGraphRelation = {
  id: string;
  sourceId: string;
  targetId: string;
};

export type KnowledgeGraphScope = 1 | 2 | 3;
export type KnowledgeGraphScenario = "graph" | "mindmap";
export type KnowledgeGraphRelationKind = "link" | "outline";

export const knowledgeGraphCameraSettleDelayMs = 96;
export const knowledgeGraphWheelSettleDelayMs = 140;

export const knowledgeGraphRelationKindsForScenario = (
  scenario: KnowledgeGraphScenario,
): readonly KnowledgeGraphRelationKind[] =>
  scenario === "graph" ? ["link", "outline"] : ["outline"];

export const nextKnowledgeGraphScope = (
  scope: KnowledgeGraphScope,
  wheelDeltaY: number,
): KnowledgeGraphScope =>
  (wheelDeltaY > 0 ? Math.min(3, scope + 1) : Math.max(1, scope - 1)) as KnowledgeGraphScope;

export const shouldExpandKnowledgeGraphLabels = (
  scope: KnowledgeGraphScope,
  cameraRatio: number,
): boolean => scope === 3 && cameraRatio <= 0.18;

export const initialKnowledgeGraphCameraRatio = (scope: KnowledgeGraphScope): number =>
  scope === 1 ? 0.84 : scope === 2 ? 0.56 : 0.3;

type GraphNodeAttributes = {
  baseBorderColor: string;
  baseColor: string;
  baseSize: number;
  borderColor: string;
  color: string;
  forceLabel: boolean;
  haloColor: string;
  label: string;
  labelColor: string;
  role: KnowledgeGraphNode["role"];
  size: number;
  sourceAnchor: boolean;
  sourceFile: string;
  todo: string;
  todoColor: string;
  type: "border";
  x: number;
  y: number;
};

type GraphEdgeAttributes = {
  baseColor: string;
  color: string;
  kind: KnowledgeGraphRelationKind;
  size: number;
  type: "line";
};

type GraphLabelData = GraphNodeAttributes & {
  focused?: boolean;
};

type KnowledgeCommunityOutline = {
  points: readonly ViewportPoint[];
  sourceFile: string;
};

export function OrgKnowledgeGraph({
  activeNodeId,
  nodes,
  relations = [],
  onNavigate,
  onScopeChange,
  scenario,
  scope,
}: {
  activeNodeId: string;
  nodes: readonly KnowledgeGraphNode[];
  relations?: readonly KnowledgeGraphRelation[];
  onNavigate: (node: KnowledgeGraphNode) => void;
  onScopeChange: (scope: KnowledgeGraphScope) => void;
  scenario: KnowledgeGraphScenario;
  scope: KnowledgeGraphScope;
}): ReactNode {
  const hostRef = useRef<HTMLDivElement>(null);
  const [containerReady, setContainerReady] = useState(false);
  const [themeRevision, setThemeRevision] = useState(0);

  useEffect(() => {
    const root = window.document.documentElement;
    const observer = new MutationObserver(() => setThemeRevision((revision) => revision + 1));
    observer.observe(root, {
      attributeFilter: ["data-theme", "data-theme-variant"],
      attributes: true,
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !("ResizeObserver" in window)) return;
    const updateReadiness = (): void => {
      const rect = host.getBoundingClientRect();
      setContainerReady(host.isConnected && rect.width >= 2 && rect.height >= 2);
    };
    const observer = new ResizeObserver(updateReadiness);
    observer.observe(host);
    updateReadiness();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !containerReady || nodes.length === 0) return;
    if (typeof WebGL2RenderingContext === "undefined") return;
    host.dataset.graphScope = String(scope);
    const palette = paletteFor(host);
    const graph = new Graph<GraphNodeAttributes, GraphEdgeAttributes>({
      allowSelfLoops: false,
      multi: true,
      type: "directed",
    });
    const byId = new Map(nodes.map((node) => [node.id, node]));
    for (const node of nodes) {
      const baseColor = colorFor(node, palette);
      const baseBorderColor = borderColorFor(node, palette);
      const baseSize = sizeFor(node);
      graph.addNode(node.id, {
        baseBorderColor,
        baseColor,
        baseSize,
        borderColor: baseBorderColor,
        color: baseColor,
        forceLabel: node.role === "current" || (node.role === "source" && Boolean(node.overview)),
        haloColor: withAlpha(baseBorderColor, node.role === "current" ? 0.3 : 0.08),
        label: node.label,
        labelColor: labelColorFor(node, palette),
        role: node.role,
        size: baseSize,
        sourceAnchor: node.rangeStart === null && Boolean(node.sourceFile),
        sourceFile: node.sourceFile ?? "",
        todo: node.todo ?? "",
        todoColor: palette.todo,
        type: "border",
        x: node.x,
        y: node.y,
      });
    }
    for (const node of nodes) {
      if (!graph.hasNode(node.parentId)) continue;
      graph.addEdgeWithKey(`tree:${node.parentId}->${node.id}`, node.parentId, node.id, {
        baseColor: palette.treeEdge,
        color: palette.treeEdge,
        kind: "outline",
        size: 0.36,
        type: "line",
      });
    }
    for (const relation of relations) {
      if (!graph.hasNode(relation.sourceId) || !graph.hasNode(relation.targetId)) continue;
      graph.addEdgeWithKey(`link:${relation.id}`, relation.sourceId, relation.targetId, {
        baseColor: palette.linkEdge,
        color: palette.linkEdge,
        kind: "link",
        size: 0.52,
        type: "line",
      });
    }

    let disposed = false;
    let disposeRenderer = (): void => graph.clear();
    const mountController = new AbortController();
    void mountSigmaGraph({
      activeNodeId,
      byId,
      graph,
      host,
      onNavigate,
      onScopeChange,
      palette,
      scenario,
      signal: mountController.signal,
      scope,
      setDispose: (dispose) => {
        if (disposed) dispose();
        else disposeRenderer = dispose;
      },
    });
    return () => {
      disposed = true;
      mountController.abort();
      disposeRenderer();
    };
  }, [
    activeNodeId,
    containerReady,
    nodes,
    onNavigate,
    onScopeChange,
    relations,
    scenario,
    scope,
    themeRevision,
  ]);

  return <div ref={hostRef} className="org-world-tree-knowledge-graph" data-scenario={scenario} />;
}

const mountSigmaGraph = async ({
  activeNodeId,
  byId,
  graph,
  host,
  onNavigate,
  onScopeChange,
  palette,
  scenario,
  setDispose,
  signal,
  scope,
}: {
  activeNodeId: string;
  byId: ReadonlyMap<string, KnowledgeGraphNode>;
  graph: Graph<GraphNodeAttributes, GraphEdgeAttributes>;
  host: HTMLElement;
  onNavigate: (node: KnowledgeGraphNode) => void;
  onScopeChange: (scope: KnowledgeGraphScope) => void;
  palette: GraphPalette;
  scenario: KnowledgeGraphScenario;
  setDispose: (dispose: () => void) => void;
  signal: AbortSignal;
  scope: KnowledgeGraphScope;
}): Promise<void> => {
  // Sigma touches WebGL globals during module evaluation. Loading it only when
  // the canvas mounts keeps static generation and non-WebGL tests pure.
  const [{ createNodeBorderProgram }, { default: Sigma }] = await Promise.all([
    import("@sigma/node-border"),
    import("sigma"),
  ]);
  if (signal.aborted) return;
  const rect = host.getBoundingClientRect();
  if (signal.aborted || !host.isConnected || rect.width < 2 || rect.height < 2) {
    graph.clear();
    return;
  }
  const KnowledgeNodeProgram = createNodeBorderProgram({
    borders: [
      { color: { attribute: "haloColor" }, size: { mode: "pixels", value: 3.6 } },
      { color: { attribute: "borderColor" }, size: { mode: "pixels", value: 1.4 } },
      { color: { attribute: "color" }, size: { fill: true } },
    ],
  });
  let highlightedNodeId = activeNodeId;
  let focusedSourceFile = byId.get(activeNodeId)?.sourceFile ?? "";
  let focusDepths = new Map<string, number>([[activeNodeId, 0]]);
  let visibleLabels = new Set<string>([activeNodeId]);
  let expandedLabels = false;
  let motionTween: gsap.core.Tween | null = null;
  let cameraFrame = 0;
  let cameraSettleTimer: number | null = null;
  let wheelSettleTimer: number | null = null;
  let pendingWheelDelta = 0;
  let pendingExpandedLabels = false;
  let cameraMoving = false;
  const motion = { progress: 0 };
  const pulseValue = (): number => (1 - Math.cos(motion.progress * Math.PI * 2)) / 2;

  const renderer = new Sigma(graph, host, {
    defaultDrawNodeHover: (context, data, settings) =>
      drawKnowledgeGraphLabel(context, data as GraphLabelData, settings, true),
    defaultDrawNodeLabel: (context, data, settings) =>
      drawKnowledgeGraphLabel(context, data as GraphLabelData, settings, false),
    defaultEdgeColor: palette.mutedEdge,
    defaultNodeColor: palette.node,
    hideEdgesOnMove: false,
    itemSizesReference: "screen",
    labelDensity: 0.16,
    labelColor: { color: palette.label },
    labelFont: "var(--font-sans)",
    labelGridCellSize: 104,
    labelRenderedSizeThreshold: 5,
    labelSize: 13,
    minCameraRatio: 0.06,
    maxCameraRatio: 4,
    nodeProgramClasses: { border: KnowledgeNodeProgram },
    nodeReducer: (node, data) => {
      const selected = node === highlightedNodeId;
      const neighborhoodDepth = focusDepths.get(node);
      const direct = neighborhoodDepth === 1;
      const nearby = neighborhoodDepth !== undefined;
      const sameSource = Boolean(focusedSourceFile) && data.sourceFile === focusedSourceFile;
      const sourceAnchor = data.role === "source";
      const backgroundAlpha = scope === 3 ? 0.22 : 0.32;
      const sourceAlpha = sourceAnchor ? 0.92 : 0.66;
      const emphasis = selected ? 1.48 : direct ? 1.08 : nearby ? 0.94 : sameSource ? 0.9 : 0.58;
      return {
        ...data,
        borderColor: selected
          ? palette.currentBorder
          : nearby
            ? data.baseBorderColor
            : withAlpha(data.baseBorderColor, sameSource ? sourceAlpha : backgroundAlpha),
        color: selected
          ? palette.current
          : nearby
            ? data.baseColor
            : withAlpha(data.baseColor, sameSource ? sourceAlpha : backgroundAlpha),
        focused: selected,
        forceLabel: selected || (sourceAnchor && visibleLabels.has(node)),
        haloColor: selected
          ? withAlpha(palette.current, 0.46)
          : direct
            ? withAlpha(data.baseBorderColor, 0.18)
            : nearby
              ? withAlpha(data.baseBorderColor, 0.1)
              : withAlpha(data.baseBorderColor, 0.035),
        label: visibleLabels.has(node) ? data.label : "",
        size: Math.max(2.4, data.baseSize * emphasis),
        zIndex: selected ? 5 : direct ? 4 : nearby ? 3 : sourceAnchor ? 3 : sameSource ? 2 : 1,
      };
    },
    edgeReducer: (edge, data) => {
      const [source, target] = graph.extremities(edge);
      const selected = source === highlightedNodeId || target === highlightedNodeId;
      const local = focusDepths.has(source) && focusDepths.has(target);
      const active = selected || local;
      const explicitLink = data.kind === "link";
      return {
        ...data,
        hidden: scenario === "mindmap",
        color: selected
          ? withAlpha(explicitLink ? palette.linkEdge : palette.current, explicitLink ? 0.92 : 0.48)
          : local
            ? withAlpha(explicitLink ? palette.linkEdge : data.baseColor, explicitLink ? 0.5 : 0.2)
            : withAlpha(data.baseColor, explicitLink ? 0.3 : scope === 3 ? 0.11 : 0.075),
        size: selected
          ? explicitLink
            ? 1.5
            : 0.72
          : active
            ? explicitLink
              ? 0.9
              : 0.44
            : explicitLink
              ? 0.58
              : 0.24,
        zIndex: active ? 3 : 1,
      };
    },
    renderEdgeLabels: false,
    renderLabels: true,
    zIndex: true,
  });

  const backdropLayer = createGraphLayer(host, "org-world-tree-network-layer");
  const communityLayer = createGraphLayer(host, "org-world-tree-community-layer");
  const communityOutlines = knowledgeCommunityOutlines(graph);
  let rendererDisposed = false;
  const drawBackdrop = (): void => {
    drawKnowledgeBackdrop({
      activeSourceFile: focusedSourceFile,
      canvas: backdropLayer,
      communityOutlines,
      graph,
      highlightedNodeId,
      host,
      palette,
      scenario,
      scope,
      toViewport: (point) => renderer.graphToViewport(point),
    });
  };
  const drawCommunities = (): void => {
    drawKnowledgeCommunities({
      canvas: communityLayer,
      graph,
      host,
      palette,
      highlightedNodeId,
      flowValue: motion.progress,
      pulseValue: pulseValue(),
      scenario,
      toViewport: (point) => renderer.graphToViewport(point),
    });
  };

  const setCameraMoving = (moving: boolean): void => {
    if (cameraMoving === moving) return;
    cameraMoving = moving;
    if (moving) {
      host.dataset.cameraMoving = "true";
      motionTween?.pause();
    } else {
      delete host.dataset.cameraMoving;
    }
  };

  const settleCamera = (): void => {
    cameraSettleTimer = null;
    if (rendererDisposed) return;
    setCameraMoving(false);
    const labelsChanged = pendingExpandedLabels !== expandedLabels;
    expandedLabels = pendingExpandedLabels;
    if (labelsChanged) focus(highlightedNodeId);
    else {
      drawBackdrop();
      drawCommunities();
      motionTween?.resume();
    }
  };

  const scheduleCameraSettled = (ratio: number): void => {
    pendingExpandedLabels = shouldExpandKnowledgeGraphLabels(scope, ratio);
    setCameraMoving(true);
    if (cameraSettleTimer !== null) window.clearTimeout(cameraSettleTimer);
    cameraSettleTimer = window.setTimeout(settleCamera, knowledgeGraphCameraSettleDelayMs);
  };

  const focus = (nodeId: string): void => {
    const neighborhoodDepths = semanticNeighborhoodDepths(graph, nodeId, scenario, 2);
    highlightedNodeId = nodeId;
    focusDepths = neighborhoodDepths;
    focusedSourceFile = byId.get(nodeId)?.sourceFile ?? focusedSourceFile;
    const sourceLabels = graph.filterNodes((id) => {
      const candidate = byId.get(id);
      return (
        candidate?.role === "source" &&
        (candidate.overview || candidate.sourceFile === focusedSourceFile)
      );
    });
    visibleLabels = expandedLabels
      ? new Set([
          ...sourceLabels,
          ...graph.filterNodes((id) => byId.get(id)?.sourceFile === focusedSourceFile),
        ])
      : new Set([...sourceLabels, ...neighborhoodDepths.keys()]);
    motionTween?.kill();
    motion.progress = 0;
    if (graph.hasNode(nodeId) && scenario === "graph") {
      motionTween = gsap.to(motion, {
        duration: 2.4,
        ease: "none",
        onUpdate: () => {
          drawCommunities();
        },
        repeat: -1,
        progress: 1,
      });
    }
    drawBackdrop();
    drawCommunities();
    renderer.refresh();
  };

  renderer.on("enterNode", ({ node }) => focus(node));
  renderer.on("leaveNode", () => focus(activeNodeId));
  renderer.on("clickNode", ({ node }) => {
    const target = byId.get(node);
    if (target) onNavigate(target);
  });
  renderer.getCamera().on("updated", ({ ratio }) => scheduleCameraSettled(ratio));
  focus(activeNodeId);
  renderer.refresh();
  const focusCamera = (duration: number): void => {
    let attempts = 0;
    const applyFocus = (): void => {
      if (!graph.hasNode(activeNodeId) && attempts < 8) {
        attempts += 1;
        cameraFrame = window.requestAnimationFrame(applyFocus);
        return;
      }
      if (!graph.hasNode(activeNodeId)) return;

      // Camera coordinates live in Sigma's normalized graph frame. Display
      // data can still contain raw layout coordinates before the first full
      // processing pass, especially for the pre-positioned corpus graph.
      const active = graph.getNodeAttributes(activeNodeId);
      const focal = renderer.viewportToFramedGraph(
        renderer.graphToViewport({ x: active.x, y: active.y }),
      );
      void renderer.getCamera().animate(
        {
          ratio: initialKnowledgeGraphCameraRatio(scope),
          x: focal.x,
          y: focal.y,
        },
        { duration, easing: "quadraticOut" },
      );
    };
    cameraFrame = window.requestAnimationFrame(applyFocus);
  };
  focusCamera(620);
  const onWheel = (event: WheelEvent): void => {
    pendingWheelDelta += event.deltaY;
    if (wheelSettleTimer !== null) window.clearTimeout(wheelSettleTimer);
    wheelSettleTimer = window.setTimeout(() => {
      wheelSettleTimer = null;
      const wheelDelta = pendingWheelDelta;
      pendingWheelDelta = 0;
      if (Math.abs(wheelDelta) < 24) return;
      const nextScope = nextKnowledgeGraphScope(scope, wheelDelta);
      if (nextScope !== scope) onScopeChange(nextScope);
    }, knowledgeGraphWheelSettleDelayMs);
  };
  host.addEventListener("wheel", onWheel, { capture: true, passive: true });
  setDispose(() => {
    if (rendererDisposed) return;
    rendererDisposed = true;
    host.removeEventListener("wheel", onWheel, { capture: true });
    window.cancelAnimationFrame(cameraFrame);
    if (cameraSettleTimer !== null) window.clearTimeout(cameraSettleTimer);
    if (wheelSettleTimer !== null) window.clearTimeout(wheelSettleTimer);
    motionTween?.kill();
    delete host.dataset.cameraMoving;
    renderer.kill();
    backdropLayer.remove();
    communityLayer.remove();
    graph.clear();
  });
};

const drawKnowledgeGraphLabel = (
  context: CanvasRenderingContext2D,
  data: GraphLabelData,
  settings: { labelFont: string; labelSize: number; labelWeight: string },
  hovered: boolean,
): void => {
  if (!data.label) return;
  const viewportWidth = context.canvas.clientWidth;
  const viewportHeight = context.canvas.clientHeight;
  if (data.x < 14 || data.x > viewportWidth - 28 || data.y < 18 || data.y > viewportHeight - 18) {
    return;
  }
  const prominent = data.focused || hovered;
  const source = data.role === "source";
  const fontSize = prominent ? 14 : source ? 12 : 11;
  const fontWeight = prominent ? 650 : source ? 600 : 500;
  const offset = data.size + (prominent ? 10 : 7);
  const x = data.x + offset;
  const y = data.y;
  context.font = `${fontWeight} ${fontSize}px ${settings.labelFont}`;
  context.textAlign = "left";
  context.textBaseline = "middle";
  const label = fitCanvasText(context, data.label, prominent ? 260 : source ? 170 : 150);
  const todo = data.todo && !source ? data.todo : "";
  const todoWidth = todo ? context.measureText(todo).width + 12 : 0;
  const labelX = x + (todo ? todoWidth + 6 : 0);
  const width = context.measureText(label).width + (todo ? todoWidth + 6 : 0);
  if (prominent) {
    context.fillStyle = withAlpha(data.color, 0.12);
    context.strokeStyle = withAlpha(data.borderColor, 0.78);
    context.lineWidth = 1;
    context.beginPath();
    context.roundRect(x - 6, y - fontSize * 0.8, width + 12, fontSize * 1.6, 4);
    context.fill();
    context.stroke();
  }
  if (todo) {
    context.fillStyle = withAlpha(data.todoColor, prominent ? 0.18 : 0.1);
    context.strokeStyle = withAlpha(data.todoColor, prominent ? 0.78 : 0.5);
    context.lineWidth = 1;
    context.beginPath();
    context.roundRect(x - 2, y - fontSize * 0.68, todoWidth, fontSize * 1.36, 4);
    context.fill();
    context.stroke();
    context.fillStyle = data.todoColor;
    context.font = `650 ${Math.max(9, fontSize - 2)}px ${settings.labelFont}`;
    context.fillText(todo, x + 4, y);
    context.font = `${fontWeight} ${fontSize}px ${settings.labelFont}`;
  }
  context.fillStyle = data.labelColor;
  context.fillText(label, labelX, y);
};

const fitCanvasText = (
  context: CanvasRenderingContext2D,
  label: string,
  maxWidth: number,
): string => {
  if (context.measureText(label).width <= maxWidth) return label;
  let low = 0;
  let high = label.length;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (context.measureText(`${label.slice(0, middle)}...`).width <= maxWidth) low = middle;
    else high = middle - 1;
  }
  return `${label.slice(0, low)}...`;
};

const createGraphLayer = (host: HTMLElement, className: string): HTMLCanvasElement => {
  const layer = window.document.createElement("canvas");
  layer.className = className;
  layer.setAttribute("aria-hidden", "true");
  host.prepend(layer);
  return layer;
};

const prepareGraphLayer = (
  canvas: HTMLCanvasElement,
  host: HTMLElement,
): { context: CanvasRenderingContext2D; height: number; width: number } | null => {
  const rect = host.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return null;
  const density = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.round(rect.width * density);
  const height = Math.round(rect.height * density);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.setTransform(density, 0, 0, density, 0, 0);
  context.clearRect(0, 0, rect.width, rect.height);
  return { context, height: rect.height, width: rect.width };
};

const drawKnowledgeBackdrop = ({
  activeSourceFile,
  canvas,
  communityOutlines,
  graph,
  highlightedNodeId,
  host,
  palette,
  scenario,
  scope,
  toViewport,
}: {
  activeSourceFile: string;
  canvas: HTMLCanvasElement;
  communityOutlines: readonly KnowledgeCommunityOutline[];
  graph: Graph<GraphNodeAttributes, GraphEdgeAttributes>;
  highlightedNodeId: string;
  host: HTMLElement;
  palette: GraphPalette;
  scenario: KnowledgeGraphScenario;
  scope: KnowledgeGraphScope;
  toViewport: (point: { x: number; y: number }) => { x: number; y: number };
}): void => {
  const layer = prepareGraphLayer(canvas, host);
  if (!layer) return;
  if (scope === 3) {
    drawCommunityFields(layer.context, communityOutlines, activeSourceFile, palette, toViewport);
  }
  if (scenario === "mindmap") {
    drawMindMapBranches(layer.context, graph, highlightedNodeId, palette, toViewport);
  }
};

const drawKnowledgeCommunities = ({
  canvas,
  graph,
  highlightedNodeId,
  host,
  palette,
  flowValue,
  pulseValue,
  scenario,
  toViewport,
}: {
  canvas: HTMLCanvasElement;
  graph: Graph<GraphNodeAttributes, GraphEdgeAttributes>;
  highlightedNodeId: string;
  host: HTMLElement;
  palette: GraphPalette;
  flowValue: number;
  pulseValue: number;
  scenario: KnowledgeGraphScenario;
  toViewport: (point: { x: number; y: number }) => { x: number; y: number };
}): void => {
  const layer = prepareGraphLayer(canvas, host);
  if (!layer) return;
  const { context } = layer;
  drawFocusField(context, graph, highlightedNodeId, palette, scenario, toViewport);
  if (scenario === "graph") {
    drawFocusTrails(context, graph, highlightedNodeId, palette, flowValue, pulseValue, toViewport);
  }
};

type ViewportPoint = { x: number; y: number };

const knowledgeCommunityOutlines = (
  graph: Graph<GraphNodeAttributes, GraphEdgeAttributes>,
): readonly KnowledgeCommunityOutline[] => {
  const groups = new Map<string, ViewportPoint[]>();
  graph.forEachNode((_id, attributes) => {
    if (!attributes.sourceFile) return;
    const points = groups.get(attributes.sourceFile) ?? [];
    points.push({ x: attributes.x, y: attributes.y });
    groups.set(attributes.sourceFile, points);
  });
  return [...groups].map(([sourceFile, points]) => ({
    points: convexHull(points),
    sourceFile,
  }));
};

const drawCommunityFields = (
  context: CanvasRenderingContext2D,
  outlines: readonly KnowledgeCommunityOutline[],
  activeSourceFile: string,
  palette: GraphPalette,
  toViewport: (point: ViewportPoint) => ViewportPoint,
): void => {
  for (const { sourceFile, points: graphPoints } of outlines) {
    const points = graphPoints.map(toViewport);
    const active = sourceFile === activeSourceFile;
    const color = communityColorFor(sourceFile, palette);
    const hull = expandedHull(points, active ? 25 : 16);
    context.save();
    if (hull.length >= 3) {
      const center = centroid(hull);
      const radius = Math.max(
        ...hull.map((point) => Math.hypot(point.x - center.x, point.y - center.y)),
      );
      const wash = context.createRadialGradient(center.x, center.y, 0, center.x, center.y, radius);
      wash.addColorStop(0, withAlpha(color, active ? 0.09 : 0.025));
      wash.addColorStop(0.68, withAlpha(color, active ? 0.045 : 0.012));
      wash.addColorStop(1, withAlpha(color, 0));
      traceSmoothHull(context, hull);
      context.fillStyle = wash;
      context.fill();
      traceSmoothHull(context, hull);
      context.strokeStyle = withAlpha(color, active ? 0.17 : 0.045);
      context.lineWidth = active ? 1 : 0.65;
      context.stroke();
    } else if (hull.length === 2) {
      context.beginPath();
      context.moveTo(hull[0]!.x, hull[0]!.y);
      context.lineTo(hull[1]!.x, hull[1]!.y);
      context.strokeStyle = withAlpha(color, active ? 0.08 : 0.025);
      context.lineCap = "round";
      context.lineWidth = active ? 38 : 26;
      context.stroke();
    }
    context.restore();
  }
};

const drawFocusField = (
  context: CanvasRenderingContext2D,
  graph: Graph<GraphNodeAttributes, GraphEdgeAttributes>,
  highlightedNodeId: string,
  palette: GraphPalette,
  scenario: KnowledgeGraphScenario,
  toViewport: (point: ViewportPoint) => ViewportPoint,
): void => {
  if (!graph.hasNode(highlightedNodeId)) return;
  const focal = toViewport(graph.getNodeAttributes(highlightedNodeId));
  const points = [
    focal,
    ...semanticNeighbors(graph, highlightedNodeId, scenario)
      .map((neighbor) => toViewport(graph.getNodeAttributes(neighbor)))
      .filter((point) => Math.hypot(point.x - focal.x, point.y - focal.y) <= 280),
  ];
  if (points.length < 2) return;
  const hull = expandedHull(points, 30);
  context.save();
  if (hull.length >= 3) {
    traceSmoothHull(context, hull);
    context.fillStyle = withAlpha(palette.current, 0.035);
    context.fill();
    traceSmoothHull(context, expandedHull(points, 20));
    context.strokeStyle = withAlpha(palette.current, 0.15);
    context.lineWidth = 1;
    context.stroke();
  } else {
    context.beginPath();
    context.moveTo(hull[0]!.x, hull[0]!.y);
    context.lineTo(hull[1]!.x, hull[1]!.y);
    context.strokeStyle = withAlpha(palette.current, 0.055);
    context.lineCap = "round";
    context.lineWidth = 24;
    context.stroke();
  }
  context.restore();
};

const drawFocusTrails = (
  context: CanvasRenderingContext2D,
  graph: Graph<GraphNodeAttributes, GraphEdgeAttributes>,
  highlightedNodeId: string,
  palette: GraphPalette,
  flowValue: number,
  pulseValue: number,
  toViewport: (point: ViewportPoint) => ViewportPoint,
): void => {
  if (!graph.hasNode(highlightedNodeId)) return;
  const focal = graph.getNodeAttributes(highlightedNodeId);
  const focalPoint = toViewport(focal);
  const orbitRadius = focal.baseSize + 15;
  for (const neighbor of semanticNeighbors(graph, highlightedNodeId, "graph")) {
    const neighborPoint = toViewport(graph.getNodeAttributes(neighbor));
    const angle = Math.atan2(neighborPoint.y - focalPoint.y, neighborPoint.x - focalPoint.x);
    context.fillStyle = withAlpha(palette.current, 0.52);
    context.beginPath();
    context.arc(
      focalPoint.x + Math.cos(angle) * orbitRadius,
      focalPoint.y + Math.sin(angle) * orbitRadius,
      1.8,
      0,
      Math.PI * 2,
    );
    context.fill();
  }
  for (const edge of graph.edges(highlightedNodeId)) {
    const attributes = graph.getEdgeAttributes(edge);
    const [source, target] = graph.extremities(edge);
    const sourceAttributes = graph.getNodeAttributes(source);
    const targetAttributes = graph.getNodeAttributes(target);
    const endpoints = trimTrail(
      toViewport(sourceAttributes),
      toViewport(targetAttributes),
      sourceAttributes.baseSize + 7,
      targetAttributes.baseSize + 7,
    );
    if (!endpoints) continue;
    const explicitLink = attributes.kind === "link";
    const color = explicitLink ? palette.linkEdge : palette.current;
    const curve = relationCurve(endpoints.source, endpoints.target, edge, explicitLink);
    const gradient = context.createLinearGradient(
      endpoints.source.x,
      endpoints.source.y,
      endpoints.target.x,
      endpoints.target.y,
    );
    gradient.addColorStop(0, withAlpha(color, explicitLink ? 0.88 : 0.58));
    gradient.addColorStop(0.55, withAlpha(color, explicitLink ? 0.54 : 0.32));
    gradient.addColorStop(1, withAlpha(color, explicitLink ? 0.24 : 0.14));
    context.save();
    context.lineCap = "round";
    context.strokeStyle = withAlpha(color, explicitLink ? 0.1 : 0.055);
    context.lineWidth = explicitLink ? 8 : 5;
    traceRelationCurve(context, curve);
    context.stroke();
    context.strokeStyle = gradient;
    context.lineWidth = explicitLink ? 1.9 : 1.15;
    if (!explicitLink) context.setLineDash([2, 5]);
    traceRelationCurve(context, curve);
    context.stroke();
    context.setLineDash([]);
    if (explicitLink) drawRelationArrow(context, curve, color);
    const progress = (flowValue + relationPhase(edge)) % 1;
    const particle = pointOnRelationCurve(curve, progress);
    const particleRadius = explicitLink ? 2.7 : 1.8;
    context.shadowBlur = explicitLink ? 11 : 6;
    context.shadowColor = withAlpha(color, 0.7);
    context.fillStyle = withAlpha(color, explicitLink ? 0.96 : 0.72);
    context.beginPath();
    context.arc(particle.x, particle.y, particleRadius, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  const radius = focal.baseSize + 10 + pulseValue * 4;
  context.save();
  context.strokeStyle = withAlpha(palette.current, 0.34 - pulseValue * 0.12);
  context.lineWidth = 1.2;
  context.beginPath();
  context.arc(focalPoint.x, focalPoint.y, radius, 0, Math.PI * 2);
  context.stroke();
  context.restore();
};

type RelationCurve = {
  control: ViewportPoint;
  source: ViewportPoint;
  target: ViewportPoint;
};

const relationCurve = (
  source: ViewportPoint,
  target: ViewportPoint,
  edgeId: string,
  explicitLink: boolean,
): RelationCurve => {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const length = Math.max(1, Math.hypot(dx, dy));
  const direction = stableHash(edgeId) % 2 === 0 ? 1 : -1;
  const bend = Math.min(explicitLink ? 56 : 28, Math.max(explicitLink ? 18 : 8, length * 0.12));
  return {
    source,
    control: {
      x: (source.x + target.x) / 2 - (dy / length) * bend * direction,
      y: (source.y + target.y) / 2 + (dx / length) * bend * direction,
    },
    target,
  };
};

export const pointOnQuadraticRelation = (
  source: ViewportPoint,
  control: ViewportPoint,
  target: ViewportPoint,
  progress: number,
): ViewportPoint => {
  const inverse = 1 - progress;
  return {
    x: inverse * inverse * source.x + 2 * inverse * progress * control.x + progress ** 2 * target.x,
    y: inverse * inverse * source.y + 2 * inverse * progress * control.y + progress ** 2 * target.y,
  };
};

const pointOnRelationCurve = (curve: RelationCurve, progress: number): ViewportPoint =>
  pointOnQuadraticRelation(curve.source, curve.control, curve.target, progress);

const traceRelationCurve = (context: CanvasRenderingContext2D, curve: RelationCurve): void => {
  context.beginPath();
  context.moveTo(curve.source.x, curve.source.y);
  context.quadraticCurveTo(curve.control.x, curve.control.y, curve.target.x, curve.target.y);
};

const drawRelationArrow = (
  context: CanvasRenderingContext2D,
  curve: RelationCurve,
  color: string,
): void => {
  const tangent = {
    x: curve.target.x - curve.control.x,
    y: curve.target.y - curve.control.y,
  };
  const angle = Math.atan2(tangent.y, tangent.x);
  const length = 7;
  context.fillStyle = withAlpha(color, 0.86);
  context.beginPath();
  context.moveTo(curve.target.x, curve.target.y);
  context.lineTo(
    curve.target.x - Math.cos(angle - 0.48) * length,
    curve.target.y - Math.sin(angle - 0.48) * length,
  );
  context.lineTo(
    curve.target.x - Math.cos(angle + 0.48) * length,
    curve.target.y - Math.sin(angle + 0.48) * length,
  );
  context.closePath();
  context.fill();
};

const relationPhase = (edgeId: string): number => (stableHash(edgeId) % 100) / 100;

const drawMindMapBranches = (
  context: CanvasRenderingContext2D,
  graph: Graph<GraphNodeAttributes, GraphEdgeAttributes>,
  highlightedNodeId: string,
  palette: GraphPalette,
  toViewport: (point: ViewportPoint) => ViewportPoint,
): void => {
  if (!graph.hasNode(highlightedNodeId)) return;
  const localNodes = new Set([
    highlightedNodeId,
    ...semanticNeighbors(graph, highlightedNodeId, "mindmap"),
  ]);
  graph.forEachEdge((_edge, attributes, source, target) => {
    if (attributes.kind !== "outline") return;
    const local = localNodes.has(source) && localNodes.has(target);
    const sourceAttributes = graph.getNodeAttributes(source);
    const targetAttributes = graph.getNodeAttributes(target);
    const endpoints = trimTrail(
      toViewport(sourceAttributes),
      toViewport(targetAttributes),
      sourceAttributes.baseSize + 7,
      targetAttributes.baseSize + 7,
    );
    if (!endpoints) return;
    const dx = endpoints.target.x - endpoints.source.x;
    const controlX = endpoints.source.x + dx * 0.52;
    const branch = (): void => {
      context.beginPath();
      context.moveTo(endpoints.source.x, endpoints.source.y);
      context.bezierCurveTo(
        controlX,
        endpoints.source.y,
        controlX,
        endpoints.target.y,
        endpoints.target.x,
        endpoints.target.y,
      );
    };
    context.save();
    context.lineCap = "round";
    branch();
    context.strokeStyle = withAlpha(palette.treeEdge, local ? 0.1 : 0.025);
    context.lineWidth = local ? 8 : 4;
    context.stroke();
    branch();
    context.strokeStyle = withAlpha(
      local ? palette.current : palette.treeEdge,
      local ? 0.58 : 0.16,
    );
    context.lineWidth = local ? 1.5 : 0.8;
    context.stroke();
    context.restore();
  });
};

const semanticNeighbors = (
  graph: Graph<GraphNodeAttributes, GraphEdgeAttributes>,
  nodeId: string,
  scenario: KnowledgeGraphScenario,
): string[] => {
  if (!graph.hasNode(nodeId)) return [];
  const visibleKinds = knowledgeGraphRelationKindsForScenario(scenario);
  const neighbors = new Set<string>();
  for (const edge of graph.edges(nodeId)) {
    if (!visibleKinds.includes(graph.getEdgeAttribute(edge, "kind"))) continue;
    const [source, target] = graph.extremities(edge);
    neighbors.add(source === nodeId ? target : source);
  }
  return [...neighbors];
};

const semanticNeighborhoodDepths = (
  graph: Graph<GraphNodeAttributes, GraphEdgeAttributes>,
  nodeId: string,
  scenario: KnowledgeGraphScenario,
  maxDepth: number,
): Map<string, number> => {
  if (!graph.hasNode(nodeId)) return new Map();
  const depths = new Map<string, number>([[nodeId, 0]]);
  const queue = [nodeId];
  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index]!;
    const depth = depths.get(current)!;
    if (depth >= maxDepth) continue;
    for (const neighbor of semanticNeighbors(graph, current, scenario)) {
      if (depths.has(neighbor)) continue;
      depths.set(neighbor, depth + 1);
      queue.push(neighbor);
    }
  }
  return depths;
};

const trimTrail = (
  source: ViewportPoint,
  target: ViewportPoint,
  sourceRadius: number,
  targetRadius: number,
): { source: ViewportPoint; target: ViewportPoint } | null => {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const length = Math.hypot(dx, dy);
  if (length <= sourceRadius + targetRadius + 2) return null;
  const ux = dx / length;
  const uy = dy / length;
  return {
    source: { x: source.x + ux * sourceRadius, y: source.y + uy * sourceRadius },
    target: { x: target.x - ux * targetRadius, y: target.y - uy * targetRadius },
  };
};

const expandedHull = (points: readonly ViewportPoint[], padding: number): ViewportPoint[] => {
  const hull = convexHull(points);
  if (hull.length < 3) return hull;
  const center = hull.reduce(
    (sum, point) => ({ x: sum.x + point.x / hull.length, y: sum.y + point.y / hull.length }),
    { x: 0, y: 0 },
  );
  return hull.map((point) => {
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    const length = Math.max(1, Math.hypot(dx, dy));
    return { x: point.x + (dx / length) * padding, y: point.y + (dy / length) * padding };
  });
};

const centroid = (points: readonly ViewportPoint[]): ViewportPoint =>
  points.reduce(
    (sum, point) => ({ x: sum.x + point.x / points.length, y: sum.y + point.y / points.length }),
    { x: 0, y: 0 },
  );

const traceSmoothHull = (
  context: CanvasRenderingContext2D,
  hull: readonly ViewportPoint[],
): void => {
  if (hull.length < 3) return;
  const first = hull[0]!;
  const last = hull.at(-1)!;
  context.beginPath();
  context.moveTo((last.x + first.x) / 2, (last.y + first.y) / 2);
  for (let index = 0; index < hull.length; index += 1) {
    const point = hull[index]!;
    const next = hull[(index + 1) % hull.length]!;
    context.quadraticCurveTo(point.x, point.y, (point.x + next.x) / 2, (point.y + next.y) / 2);
  }
  context.closePath();
};

const convexHull = (points: readonly ViewportPoint[]): ViewportPoint[] => {
  const sorted = [...points]
    .filter(
      (point, index, all) =>
        all.findIndex((candidate) => candidate.x === point.x && candidate.y === point.y) === index,
    )
    .sort((left, right) => left.x - right.x || left.y - right.y);
  if (sorted.length <= 2) return sorted;
  const cross = (origin: ViewportPoint, left: ViewportPoint, right: ViewportPoint): number =>
    (left.x - origin.x) * (right.y - origin.y) - (left.y - origin.y) * (right.x - origin.x);
  const lower: ViewportPoint[] = [];
  for (const point of sorted) {
    while (lower.length >= 2 && cross(lower.at(-2)!, lower.at(-1)!, point) <= 0) lower.pop();
    lower.push(point);
  }
  const upper: ViewportPoint[] = [];
  for (const point of [...sorted].reverse()) {
    while (upper.length >= 2 && cross(upper.at(-2)!, upper.at(-1)!, point) <= 0) upper.pop();
    upper.push(point);
  }
  lower.pop();
  upper.pop();
  return [...lower, ...upper];
};

const sizeFor = (node: KnowledgeGraphNode): number => {
  if (node.role === "current") return node.rangeStart === null ? 12 : 15;
  if (node.role === "root") return 12;
  if (node.role === "source") return node.overview ? 11 : 9;
  if (node.role === "distant") return 4.2;
  return node.todo ? 7 : 5.4;
};

const colorFor = (node: KnowledgeGraphNode, palette: GraphPalette): string => {
  if (node.role === "current") return palette.current;
  if (node.role === "root") return palette.structural;
  if (node.todo) return palette.todo;
  return communityColorFor(node.sourceFile ?? node.id, palette);
};

const labelColorFor = (node: KnowledgeGraphNode, palette: GraphPalette): string =>
  node.role === "current"
    ? palette.current
    : node.role === "source"
      ? palette.label
      : palette.labelMuted;

type GraphPalette = {
  communities: readonly string[];
  currentBorder: string;
  current: string;
  label: string;
  labelMuted: string;
  linkEdge: string;
  mutedEdge: string;
  node: string;
  structural: string;
  surface: string;
  todo: string;
  transparent: string;
  treeEdge: string;
};

const paletteFor = (element: HTMLElement): GraphPalette => {
  const token = (name: string, fallback: string): string =>
    resolveCssColor(element, name, fallback);
  const salient = token("--face-salient", "#4e7bc7");
  const structural = token("--face-structural", "#7c5fc7");
  const popout = token("--face-popout", "#c78634");
  const success = token("--face-success", "#3e8f62");
  const critical = token("--face-critical", "#bf5360");
  const normal = token("--face-normal", "#596579");
  const faded = token("--face-faded", "#8993a4");
  const surface = token("--surface-canvas", "#f4f6f8");
  return {
    communities: [salient, structural, popout, success, critical],
    currentBorder: salient,
    current: salient,
    label: token("--face-strong", "#1d2633"),
    labelMuted: normal,
    linkEdge: structural,
    mutedEdge: withAlpha(faded, 0.18),
    node: normal,
    structural,
    surface,
    todo: popout,
    transparent: withAlpha(surface, 0),
    treeEdge: normal,
  };
};

const resolveCssColor = (element: HTMLElement, name: string, fallback: string): string => {
  const expression = window.getComputedStyle(element).getPropertyValue(name).trim() || fallback;
  const probe = window.document.createElement("span");
  probe.style.color = expression;
  probe.style.display = "none";
  element.append(probe);
  const resolved = window.getComputedStyle(probe).color || fallback;
  probe.remove();
  const parsed = parse(resolved);
  return parsed ? formatRgb(parsed) : fallback;
};

const stableHash = (identity: string): number => {
  let hash = 2166136261;
  for (let index = 0; index < identity.length; index += 1) {
    hash ^= identity.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const communityColorFor = (identity: string, palette: GraphPalette): string =>
  palette.communities[stableHash(identity) % palette.communities.length] ?? palette.current;

const withAlpha = (color: string, alpha: number): string => {
  const parsed = parse(color);
  return parsed ? formatRgb({ ...parsed, alpha }) : color;
};

const borderColorFor = (node: KnowledgeGraphNode, palette: GraphPalette): string =>
  node.role === "current"
    ? palette.currentBorder
    : node.role === "root"
      ? palette.structural
      : colorFor(node, palette);
