import {
  applyNodeChanges,
  type Connection,
  type NodeChange,
  type OnConnect,
  type OnReconnect,
  type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
  createPooFlowDebuggerState,
  transitionPooFlowDebugger,
  validPooFlowBreakpointKeys,
} from "../poo-flow/graphDebugger";
import { createPooFlowGraphProjection } from "../poo-flow/graphContract";
import {
  hasPooFlowBreakpoint,
  pooFlowGraphInteractionPolicy,
  type PooFlowGraphMode,
} from "../poo-flow/graphWorkbench";
import {
  executePooFlowTopologyMutation,
  POO_FLOW_TOPOLOGY_INTENT_SCHEMA,
  type PooFlowTopologyMutationAdapter,
  type PooFlowTopologyMutationResult,
  type PooFlowTopologyOperation,
  type PooFlowTopologyReceipt,
} from "../poo-flow/topologyMutation";
import "./PooFlowGraph.css";
import { type PooFlowGraphEdge, type PooFlowGraphNode } from "./PooFlowGraphRenderers";
import { PooFlowGraphView } from "./PooFlowGraphView";
import { layout, responsiveLayoutDirection, toEdges, toNodes } from "./pooFlowGraphLayout";
import { advancePooFlowCursor, pooFlowExecutionState, type PooFlowRunResult } from "./pooFlowModel";
import {
  createPooFlowSelectionFocus,
  pooFlowEdgeFocusClass,
  pooFlowNodeFocusClass,
} from "./pooFlowSelectionFocus";
import { hiddenPooFlowNodeIds } from "./pooFlowVisibility";

export interface PooFlowGraphTopologyMutationControl {
  readonly adapter: PooFlowTopologyMutationAdapter;
  readonly revision: string;
  readonly onResult?: (result: PooFlowTopologyMutationResult) => void;
}

export interface PooFlowGraphProps {
  readonly result: PooFlowRunResult;
  readonly workflowId?: string;
  readonly mode?: PooFlowGraphMode;
  readonly topologyMutation?: PooFlowGraphTopologyMutationControl;
}

function InteractivePooFlowGraph({
  result,
  workflowId,
  mode: interactionMode = "run",
  topologyMutation,
}: PooFlowGraphProps) {
  const projection = useMemo(
    () =>
      createPooFlowGraphProjection(
        workflowId ?? result.rootId ?? result.events[0]?.id ?? "unknown-workflow",
        result,
      ),
    [result, workflowId],
  );
  const baseEdges = useMemo(() => toEdges(projection), [projection]);
  const initialNodes = useMemo(() => toNodes(projection.nodes), [projection]);
  const [layoutedNodes, setLayoutedNodes] = useState(initialNodes);
  const canonicalLayoutNodes = useRef(initialNodes);
  const [layoutGeneration, setLayoutGeneration] = useState(0);
  const [topologyPending, setTopologyPending] = useState(false);
  const [topologyReceipt, setTopologyReceipt] = useState<PooFlowTopologyReceipt>();
  const topologyIntentSequence = useRef(0);
  const debuggerWorkflowId =
    workflowId ?? result.rootId ?? result.events[0]?.id ?? "unknown-workflow";
  const [debuggerState, dispatchDebugger] = useReducer(
    transitionPooFlowDebugger,
    debuggerWorkflowId,
    createPooFlowDebuggerState,
  );
  const { cursor, playing, breakpoints } = debuggerState;
  const interactionPolicy = pooFlowGraphInteractionPolicy(interactionMode, {
    typedTopologyMutations: topologyMutation !== undefined,
  });

  const [stepDelay, setStepDelay] = useState(900);
  const [selectedId, setSelectedId] = useState<string>();
  const [selectedEdgeId, setSelectedEdgeId] = useState<string>();
  const [collapsedNodeIds, setCollapsedNodeIds] = useState<ReadonlySet<string>>(() => new Set());
  const [layoutReady, setLayoutReady] = useState(false);
  const [layoutDurationMs, setLayoutDurationMs] = useState<number>();
  const flow = useRef<ReactFlowInstance<PooFlowGraphNode, PooFlowGraphEdge> | null>(null);
  const graphElement = useRef<HTMLDivElement | null>(null);
  const selectionTrigger = useRef<HTMLElement | SVGElement | null>(null);
  const fitFrame = useRef<number | undefined>(undefined);
  const layoutSettled = useRef(false);

  const scheduleFit = useCallback(() => {
    if (fitFrame.current !== undefined) cancelAnimationFrame(fitFrame.current);
    fitFrame.current = requestAnimationFrame(() => {
      fitFrame.current = undefined;
      const bounds = graphElement.current?.getBoundingClientRect();
      if (bounds && bounds.width > 0 && bounds.height > 0) {
        void flow.current?.fitView({ padding: 0.12, duration: 240 });
      }
    });
  }, []);

  const inspectEdge = useCallback((edgeId: string) => {
    setSelectedId(undefined);
    setSelectedEdgeId(edgeId);
  }, []);

  const selectionFocus = useMemo(
    () => createPooFlowSelectionFocus(layoutedNodes, baseEdges, selectedId, selectedEdgeId),
    [baseEdges, layoutedNodes, selectedEdgeId, selectedId],
  );

  const hiddenNodeIds = useMemo(
    () => hiddenPooFlowNodeIds(projection.nodes, collapsedNodeIds),
    [collapsedNodeIds, projection.nodes],
  );

  const eventIndex = useMemo(
    () => new Map(projection.nodes.map((event, index) => [event.id, index])),
    [projection.nodes],
  );
  const childCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const node of initialNodes) {
      if (node.parentId) {
        counts.set(node.parentId, (counts.get(node.parentId) ?? 0) + 1);
      }
    }
    return counts;
  }, [initialNodes]);
  const nodes = useMemo<PooFlowGraphNode[]>(
    () =>
      layoutedNodes.map((node) => {
        const index = eventIndex.get(node.id) ?? -1;
        const event = projection.nodes[index] ?? node.data.event;
        const state = pooFlowExecutionState(index, cursor, projection.nodes.length);
        return {
          ...node,
          hidden: hiddenNodeIds.has(node.id),
          selected: node.id === selectedId,
          className: `poo-flow-node poo-flow-node--${event.kind} poo-flow-node--${state} ${pooFlowNodeFocusClass(selectionFocus, node.id) ?? ""}`,
          data: {
            event,
            state,
            index,
            eventCount: projection.nodes.length,
            childCount: childCounts.get(node.id) ?? 0,
            collapsed: collapsedNodeIds.has(node.id),
            breakpoint: hasPooFlowBreakpoint(breakpoints, { kind: "node", id: node.id }),
            mode: interactionMode,
            onToggleBreakpoint: (nodeId: string) => {
              dispatchDebugger({
                type: "toggle-breakpoint",
                target: { kind: "node", id: nodeId },
              });
            },
            onRunTo: (nodeId: string) => {
              dispatchDebugger({ type: "run-to", nodeId });
            },
            onToggleCollapse: (nodeId: string) => {
              setCollapsedNodeIds((current) => {
                const next = new Set(current);
                if (next.has(nodeId)) next.delete(nodeId);
                else next.add(nodeId);
                return next;
              });
              window.requestAnimationFrame(scheduleFit);
            },
          },
        };
      }),
    [
      cursor,
      breakpoints,
      childCounts,
      collapsedNodeIds,
      eventIndex,
      hiddenNodeIds,
      interactionMode,
      layoutedNodes,
      projection.nodes,
      scheduleFit,
      selectedId,
      selectionFocus,
    ],
  );
  const edges = useMemo<PooFlowGraphEdge[]>(
    () =>
      baseEdges.map((edge) => {
        const targetIndex = eventIndex.get(edge.target) ?? Number.POSITIVE_INFINITY;
        const active = targetIndex === cursor;
        const completed = cursor >= projection.nodes.length || targetIndex < cursor;
        return {
          ...edge,
          hidden: hiddenNodeIds.has(edge.source) || hiddenNodeIds.has(edge.target),
          data: {
            ...edge.data,
            onInspect: inspectEdge,
            selected: selectedEdgeId === edge.id,
            breakpoint: hasPooFlowBreakpoint(breakpoints, { kind: "edge", id: edge.id }),
            onToggleBreakpoint: (edgeId: string) => {
              dispatchDebugger({
                type: "toggle-breakpoint",
                target: { kind: "edge", id: edgeId },
              });
            },
          },
          animated: active,
          className: `${
            active
              ? "poo-flow-edge--running"
              : completed
                ? "poo-flow-edge--completed"
                : "poo-flow-edge--pending"
          } ${pooFlowEdgeFocusClass(selectionFocus, edge.id) ?? ""}`,
        };
      }),
    [
      baseEdges,
      cursor,
      eventIndex,
      hiddenNodeIds,
      breakpoints,
      inspectEdge,
      projection.nodes.length,
      selectedEdgeId,
      selectionFocus,
    ],
  );
  const selectedEvent = selectedId ? projection.nodes[eventIndex.get(selectedId) ?? -1] : undefined;
  const selectedNode = selectedId ? nodes.find((node) => node.id === selectedId) : undefined;
  const selectedEdge = selectedEdgeId
    ? edges.find((edge) => edge.id === selectedEdgeId)
    : undefined;

  useEffect(() => {
    const fitWhenVisible = () => {
      if (!document.hidden) scheduleFit();
    };
    window.addEventListener("resize", scheduleFit, { passive: true });
    window.addEventListener("pageshow", scheduleFit);
    window.addEventListener("org-zhixing:poo-flow-reveal", scheduleFit);
    document.addEventListener("visibilitychange", fitWhenVisible);
    scheduleFit();
    return () => {
      window.removeEventListener("resize", scheduleFit);
      window.removeEventListener("pageshow", scheduleFit);
      window.removeEventListener("org-zhixing:poo-flow-reveal", scheduleFit);
      document.removeEventListener("visibilitychange", fitWhenVisible);
      if (fitFrame.current !== undefined) cancelAnimationFrame(fitFrame.current);
    };
  }, [scheduleFit]);

  const advanceDebugger = useCallback(
    (nextCursor: number, source: "timer" | "step") => {
      const activeNode = projection.nodes[nextCursor];
      dispatchDebugger({
        type: "cursor-advanced",
        cursor: nextCursor,
        activeNodeId: activeNode?.id,
        incomingEdgeIds: activeNode
          ? baseEdges.filter((edge) => edge.target === activeNode.id).map((edge) => edge.id)
          : [],
        stepCount: projection.nodes.length,
        source,
      });
    },
    [baseEdges, projection.nodes],
  );

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => {
      if (result.execution) {
        const snapshot = result.execution.step();
        advanceDebugger(snapshot.completedSteps, "timer");
        return;
      }
      advanceDebugger(cursor < 0 ? 0 : cursor + 1, "timer");
    }, stepDelay);
    return () => window.clearTimeout(timer);
  }, [advanceDebugger, cursor, playing, result.execution, stepDelay]);

  const run = useCallback(() => {
    let nextCursor = cursor < 0 || cursor >= projection.nodes.length ? 0 : cursor;
    if (result.execution) {
      let snapshot = result.execution.position();
      if (snapshot.completedSteps >= snapshot.stepCount) snapshot = result.execution.reset();
      nextCursor = snapshot.completedSteps;
    }
    dispatchDebugger({
      type: "run",
      cursor: nextCursor,
      stepCount: projection.nodes.length,
    });
  }, [cursor, projection.nodes.length, result.execution, scheduleFit]);

  const pause = useCallback(() => {
    dispatchDebugger({ type: "pause" });
  }, [scheduleFit]);

  const step = useCallback(() => {
    const nextCursor = result.execution
      ? result.execution.step().completedSteps
      : advancePooFlowCursor(cursor, projection.nodes.length);
    advanceDebugger(nextCursor, "step");
  }, [advanceDebugger, cursor, projection.nodes.length, result.execution, scheduleFit]);

  const reset = useCallback(() => {
    result.execution?.reset();
    dispatchDebugger({ type: "reset", preserveBreakpoints: true });
    setSelectedId(undefined);
    setSelectedEdgeId(undefined);
    setCollapsedNodeIds(new Set());
    setLayoutedNodes(canonicalLayoutNodes.current);
    setLayoutGeneration((generation) => generation + 1);
  }, [result.execution]);

  useEffect(() => {
    let active = true;
    layoutSettled.current = false;
    setLayoutReady(false);
    setLayoutDurationMs(undefined);
    setLayoutedNodes(initialNodes);
    dispatchDebugger({
      type: "workflow-replaced",
      workflowId: debuggerWorkflowId,
      validBreakpointKeys: validPooFlowBreakpointKeys(
        initialNodes.map((node) => node.id),
        baseEdges.map((edge) => edge.id),
      ),
    });
    const layoutStartedAt = performance.now();
    void layout(initialNodes, baseEdges, responsiveLayoutDirection()).then((nextNodes) => {
      if (active) {
        setLayoutedNodes(nextNodes);
        canonicalLayoutNodes.current = nextNodes;
        layoutSettled.current = true;
        setLayoutDurationMs(performance.now() - layoutStartedAt);
        setLayoutReady(true);
        setLayoutGeneration((generation) => generation + 1);
      }
    });
    return () => {
      active = false;
    };
  }, [baseEdges, debuggerWorkflowId, initialNodes, scheduleFit]);

  useEffect(() => {
    if (!layoutSettled.current) return;
    const frame = requestAnimationFrame(scheduleFit);
    return () => cancelAnimationFrame(frame);
  }, [layoutGeneration, scheduleFit]);

  const handleNodesChange = useCallback((changes: NodeChange<PooFlowGraphNode>[]) => {
    setLayoutedNodes((current) => applyNodeChanges(changes, current));
  }, []);

  const submitTopologyOperation = useCallback(
    async (operation: PooFlowTopologyOperation) => {
      if (!topologyMutation || topologyPending) return;
      topologyIntentSequence.current += 1;
      setTopologyPending(true);
      try {
        const mutationResult = await executePooFlowTopologyMutation(topologyMutation.adapter, {
          schema: POO_FLOW_TOPOLOGY_INTENT_SCHEMA,
          intentId: `${debuggerWorkflowId}:${operation.kind}:${topologyIntentSequence.current}`,
          workflowId: debuggerWorkflowId,
          expectedRevision: topologyMutation.revision,
          operation,
        });
        setTopologyReceipt(mutationResult.receipt);
        topologyMutation.onResult?.(mutationResult);
      } finally {
        setTopologyPending(false);
      }
    },
    [debuggerWorkflowId, topologyMutation, topologyPending],
  );

  const handleConnect = useCallback<OnConnect>(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      void submitTopologyOperation({
        kind: "connect",
        edgeId: `${connection.source}:${connection.sourceHandle ?? "out"}->${connection.target}:${connection.targetHandle ?? "in"}`,
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
      });
    },
    [submitTopologyOperation],
  );

  const handleReconnect = useCallback<OnReconnect>(
    (edge, connection) => {
      if (!connection.source || !connection.target) return;
      void submitTopologyOperation({
        kind: "reconnect",
        edgeId: edge.id,
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
      });
    },
    [submitTopologyOperation],
  );

  const closeInspector = useCallback(() => {
    setSelectedId(undefined);
    setSelectedEdgeId(undefined);
    const trigger = selectionTrigger.current;
    requestAnimationFrame(() => trigger?.focus());
  }, []);

  return (
    <PooFlowGraphView
      graphElement={graphElement}
      layoutReady={layoutReady}
      layoutDurationMs={layoutDurationMs}
      interactionMode={interactionMode}
      interactionPolicy={interactionPolicy}
      topologyPending={topologyPending}
      topologyReceipt={topologyReceipt}
      selectedId={selectedId}
      selectedEdgeId={selectedEdgeId}
      closeInspector={closeInspector}
      nodes={nodes}
      edges={edges}
      projection={projection}
      flow={flow}
      scheduleFit={scheduleFit}
      selectionTrigger={selectionTrigger}
      setSelectedId={setSelectedId}
      setSelectedEdgeId={setSelectedEdgeId}
      handleNodesChange={handleNodesChange}
      handleConnect={handleConnect}
      handleReconnect={handleReconnect}
      selectedEvent={selectedEvent}
      selectedNode={selectedNode}
      selectedEdge={selectedEdge}
      dispatchDebugger={dispatchDebugger}
      topologyMutable={Boolean(topologyMutation)}
      submitTopologyOperation={submitTopologyOperation}
      cursor={cursor}
      playing={playing}
      run={run}
      pause={pause}
      step={step}
      reset={reset}
      stepDelay={stepDelay}
      setStepDelay={setStepDelay}
    />
  );
}

export function PooFlowGraph(props: PooFlowGraphProps) {
  return <InteractivePooFlowGraph {...props} />;
}
