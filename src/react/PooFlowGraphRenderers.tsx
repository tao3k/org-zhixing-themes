import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeToolbar,
  Handle,
  NodeToolbar,
  Position,
  getSmoothStepPath,
  type Edge,
  type EdgeProps,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import type {
  PooFlowGraphNode as SemanticPooFlowNode,
  PooFlowGraphNodeKind,
} from "../poo-flow/graphContract";
import type { PooFlowGraphMode } from "../poo-flow/graphWorkbench";
import type { PooFlowExecutionState } from "./pooFlowModel";
import { PooFlowNodeFacets } from "./PooFlowNodeFacets";
import { PooFlowSemanticIcon } from "./PooFlowSemanticIcon";
import { responsiveLayoutDirection } from "./pooFlowGraphLayout";

export type PooFlowNodeData = {
  event: SemanticPooFlowNode;
  state: PooFlowExecutionState;
  index: number;
  eventCount: number;
  childCount: number;
  collapsed: boolean;
  onToggleCollapse: (nodeId: string) => void;
  breakpoint?: boolean;
  mode?: PooFlowGraphMode;
  onToggleBreakpoint?: (nodeId: string) => void;
  onRunTo?: (nodeId: string) => void;
};

export type PooFlowGraphNode = Node<PooFlowNodeData, PooFlowGraphNodeKind>;
export type PooFlowGraphEdge = Edge<
  {
    relation?: string;
    breakpoint?: boolean;
    selected?: boolean;
    onInspect?: (edgeId: string) => void;
    onToggleBreakpoint?: (edgeId: string) => void;
  },
  "poo-flow"
>;

function nodeKindLabel(kind: SemanticPooFlowNode["kind"]): string {
  if (kind === "composition") return "Composition";
  if (kind === "case") return "Case";
  if (kind === "profile-instance") return "Profile";
  return "Step";
}

function PooFlowNode({ data, selected, isConnectable }: NodeProps<PooFlowGraphNode>) {
  const {
    event,
    state,
    index,
    eventCount,
    childCount,
    collapsed,
    onToggleCollapse,
    breakpoint = false,
    mode = "explore",
    onToggleBreakpoint = () => undefined,
    onRunTo = () => undefined,
  } = data;
  const verticalLayout = responsiveLayoutDirection() === "DOWN";
  const container = childCount > 0;
  return (
    <article
      className={`poo-flow-shape${container ? " poo-flow-shape--container" : ""}`}
      data-selected={selected || undefined}
      data-poo-flow-id={event.id}
      data-poo-flow-parent-id={event.parentId}
      data-poo-flow-scenario={event.scenario}
      aria-label={`${nodeKindLabel(data.event.kind)} ${data.event.label}, ${data.state}`}
    >
      <NodeToolbar
        isVisible={selected}
        position={Position.Bottom}
        className="poo-flow-context-toolbar nodrag nopan"
      >
        <button
          type="button"
          aria-pressed={breakpoint}
          aria-label={`${breakpoint ? "Remove" : "Add"} breakpoint ${event.label}`}
          onClick={(toolbarEvent) => {
            toolbarEvent.stopPropagation();
            onToggleBreakpoint(event.id);
          }}
        >
          {breakpoint ? "Breakpoint on" : "Breakpoint"}
        </button>
        <button
          type="button"
          disabled={mode !== "run"}
          aria-label={`Run to ${event.label}`}
          onClick={(toolbarEvent) => {
            toolbarEvent.stopPropagation();
            onRunTo(event.id);
          }}
        >
          Run to here
        </button>
      </NodeToolbar>
      <Handle
        type="target"
        position={verticalLayout ? Position.Top : Position.Left}
        isConnectable={isConnectable}
        className="poo-flow-port"
      />
      <header className="poo-flow-shape__header">
        <span className="poo-flow-shape__kind">
          <PooFlowSemanticIcon event={event} />
        </span>
        <span className="poo-flow-shape__kind-label">{nodeKindLabel(event.kind)}</span>
        <span className="poo-flow-shape__ordinal">
          {String(index + 1).padStart(2, "0")} / {String(eventCount).padStart(2, "0")}
        </span>
      </header>
      <strong className="poo-flow-shape__title">{event.label}</strong>
      <PooFlowNodeFacets event={event} />
      {container ? (
        <span className="poo-flow-shape__container-meta">
          <span>
            {childCount} contained {childCount === 1 ? "member" : "members"}
          </span>
          <button
            type="button"
            className="poo-flow-shape__collapse nodrag nopan"
            aria-expanded={!collapsed}
            aria-label={`${collapsed ? "Expand" : "Collapse"} ${event.label}`}
            onClick={(clickEvent) => {
              clickEvent.stopPropagation();
              onToggleCollapse(event.id);
            }}
          >
            {collapsed ? "Expand" : "Collapse"}
          </button>
        </span>
      ) : (
        <>
          <span className="poo-flow-shape__identity">
            {event.sourceId ?? event.detail ?? `${event.kind}:${event.id}`}
          </span>
          <footer className="poo-flow-shape__footer">
            <span>{event.relation ? `via ${event.relation}` : "entry"}</span>
            <span className="poo-flow-shape__state" data-state={state}>
              <i aria-hidden="true" />
              {state}
            </span>
          </footer>
        </>
      )}
      <Handle
        type="source"
        position={verticalLayout ? Position.Bottom : Position.Right}
        isConnectable={isConnectable}
        className="poo-flow-port"
      />
    </article>
  );
}

function PooFlowEdge({
  id,
  animated,
  selected,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
  data,
}: EdgeProps<PooFlowGraphEdge>) {
  const [path] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 12,
    offset: 28,
  });
  const verticalEdge =
    sourcePosition === Position.Top ||
    sourcePosition === Position.Bottom ||
    targetPosition === Position.Top ||
    targetPosition === Position.Bottom;
  const labelX = (sourceX + targetX) / 2 + (verticalEdge ? 18 : 0);
  const labelY = (sourceY + targetY) / 2 + (verticalEdge ? 0 : -18);
  return (
    <>
      <BaseEdge id={id} path={path} markerEnd={markerEnd} style={style} interactionWidth={28} />
      {animated ? (
        <g className="poo-flow-fluid-stream" aria-hidden="true">
          <path className="poo-flow-fluid-stream__body" d={path} pathLength="100" />
          <circle className="poo-flow-fluid-stream__pulse" r="3.5">
            <animateMotion dur="900ms" path={path} repeatCount="indefinite" />
          </circle>
        </g>
      ) : null}
      <EdgeToolbar
        edgeId={id}
        x={labelX}
        y={labelY}
        isVisible={selected}
        className="poo-flow-context-toolbar nodrag nopan"
      >
        <button
          type="button"
          aria-pressed={data?.breakpoint ?? false}
          aria-label={`${data?.breakpoint ? "Remove" : "Add"} checkpoint breakpoint ${data?.relation ?? id}`}
          onClick={(toolbarEvent) => {
            toolbarEvent.stopPropagation();
            data?.onToggleBreakpoint?.(id);
          }}
        >
          {data?.breakpoint ? "Breakpoint on" : "Breakpoint"}
        </button>
        <button
          type="button"
          aria-label={`Inspect checkpoint ${data?.relation ?? id}`}
          onClick={(toolbarEvent) => {
            toolbarEvent.stopPropagation();
            data?.onInspect?.(id);
          }}
        >
          Inspect
        </button>
      </EdgeToolbar>
      {data?.relation ? (
        <EdgeLabelRenderer>
          <button
            type="button"
            className="poo-flow-connection-label nodrag nopan"
            data-relation={data.relation}
            aria-label={`Inspect checkpoint ${data.relation}`}
            onClick={(event) => {
              event.stopPropagation();
              data.onInspect?.(id);
            }}
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
          >
            {data.relation}
          </button>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}

export const nodeTypes = {
  composition: PooFlowNode,
  case: PooFlowNode,
  "profile-instance": PooFlowNode,
  evidence: PooFlowNode,
  boundary: PooFlowNode,
  step: PooFlowNode,
};
export const edgeTypes = { "poo-flow": PooFlowEdge };
