import ELK from "elkjs/lib/elk.bundled.js";
import {
  Background,
  Controls,
  MarkerType,
  MiniMap,
  Panel,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  advancePooFlowCursor,
  pooFlowExecutionState,
  type PooFlowEdge,
  type PooFlowEvent,
  type PooFlowExecutionState,
  type PooFlowRunResult,
} from "./pooFlowModel";

const elk = new ELK();
const nodeWidth = 240;
const nodeHeight = 76;

function eventLabel(
  event: PooFlowEvent,
  state: PooFlowExecutionState,
  index: number,
  eventCount: number,
) {
  return (
    <span className="poo-flow-node__content">
      <span className="poo-flow-node__heading">
        <strong>{event.label}</strong>
        <small className="poo-flow-node__step">
          {index + 1}/{eventCount}
        </small>
      </span>
      {event.kind ? <small>{event.kind}</small> : null}
      {event.detail ? <small>{event.detail}</small> : null}
      <small className="poo-flow-node__state">{state}</small>
    </span>
  );
}

function toNodes(events: readonly PooFlowEvent[]): Node[] {
  return events.map((event, index) => ({
    id: event.id,
    position: { x: 0, y: 0 },
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
    className: "poo-flow-node poo-flow-node--pending",
    style: { width: nodeWidth, height: nodeHeight },
    data: { label: eventLabel(event, "pending", index, events.length) },
  }));
}

function inferredEdges(events: readonly PooFlowEvent[]): PooFlowEdge[] {
  return events.slice(1).map((event, index) => ({
    source: events[index].id,
    target: event.id,
  }));
}

function toEdges(result: PooFlowRunResult): Edge[] {
  const edges = result.edges ?? inferredEdges(result.events);
  return edges.map((edge, index) => ({
    id: edge.id ?? `${edge.source}-${edge.target}-${index}`,
    source: edge.source,
    target: edge.target,
    label: edge.label,
    markerEnd: { type: MarkerType.ArrowClosed },
    animated: true,
  }));
}

async function layout(nodes: Node[], edges: Edge[]): Promise<Node[]> {
  const graph = await elk.layout({
    id: "poo-flow",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "DOWN",
      "elk.layered.spacing.nodeNodeBetweenLayers": "72",
      "elk.spacing.nodeNode": "36",
    },
    children: nodes.map((node) => ({ id: node.id, width: nodeWidth, height: nodeHeight })),
    edges: edges.map((edge) => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    })),
  });

  const positions = new Map(graph.children?.map((node) => [node.id, node]) ?? []);
  return nodes.map((node) => {
    const position = positions.get(node.id);
    return {
      ...node,
      position: { x: position?.x ?? 0, y: position?.y ?? 0 },
    };
  });
}

function InteractivePooFlowGraph({ result }: { result: PooFlowRunResult }) {
  const baseEdges = useMemo(() => toEdges(result), [result]);
  const initialNodes = useMemo(() => toNodes(result.events), [result]);
  const [layoutedNodes, setLayoutedNodes] = useState(initialNodes);
  const [cursor, setCursor] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [stepDelay, setStepDelay] = useState(900);
  const [selectedId, setSelectedId] = useState<string>();
  const flow = useRef<ReactFlowInstance<Node, Edge> | null>(null);
  const graphElement = useRef<HTMLDivElement | null>(null);
  const fitFrame = useRef<number | undefined>(undefined);

  const scheduleFit = useCallback(() => {
    if (fitFrame.current !== undefined) cancelAnimationFrame(fitFrame.current);
    fitFrame.current = requestAnimationFrame(() => {
      fitFrame.current = undefined;
      const bounds = graphElement.current?.getBoundingClientRect();
      if (bounds && bounds.width > 0 && bounds.height > 0) {
        void flow.current?.fitView({ padding: 0.38, duration: 240 });
      }
    });
  }, []);

  const eventIndex = useMemo(
    () => new Map(result.events.map((event, index) => [event.id, index])),
    [result.events],
  );
  const nodes = useMemo<Node[]>(
    () =>
      layoutedNodes.map((node, index) => {
        const state = pooFlowExecutionState(index, cursor, result.events.length);
        return {
          ...node,
          selected: node.id === selectedId,
          className: `poo-flow-node poo-flow-node--${state}`,
          data: { label: eventLabel(result.events[index], state, index, result.events.length) },
        };
      }),
    [cursor, layoutedNodes, result.events, selectedId],
  );
  const edges = useMemo<Edge[]>(
    () =>
      baseEdges.map((edge) => {
        const targetIndex = eventIndex.get(edge.target) ?? Number.POSITIVE_INFINITY;
        const active = targetIndex === cursor;
        const completed = cursor >= result.events.length || targetIndex < cursor;
        return {
          ...edge,
          animated: active,
          className: active
            ? "poo-flow-edge--running"
            : completed
              ? "poo-flow-edge--completed"
              : "poo-flow-edge--pending",
        };
      }),
    [baseEdges, cursor, eventIndex, result.events.length],
  );
  const selectedEvent = selectedId ? result.events[eventIndex.get(selectedId) ?? -1] : undefined;

  useEffect(() => {
    const element = graphElement.current;
    let observer: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined" && element) {
      observer = new ResizeObserver(scheduleFit);
      observer.observe(element);
    }
    const fitWhenVisible = () => {
      if (!document.hidden) scheduleFit();
    };
    window.addEventListener("pageshow", scheduleFit);
    window.addEventListener("org-zhixing:poo-flow-reveal", scheduleFit);
    document.addEventListener("visibilitychange", fitWhenVisible);
    scheduleFit();
    return () => {
      observer?.disconnect();
      window.removeEventListener("pageshow", scheduleFit);
      window.removeEventListener("org-zhixing:poo-flow-reveal", scheduleFit);
      document.removeEventListener("visibilitychange", fitWhenVisible);
      if (fitFrame.current !== undefined) cancelAnimationFrame(fitFrame.current);
    };
  }, [scheduleFit]);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => {
      setCursor((current) => {
        const next = current < 0 ? 0 : current + 1;
        if (next >= result.events.length) {
          setPlaying(false);
          return result.events.length;
        }
        return next;
      });
    }, stepDelay);
    return () => window.clearTimeout(timer);
  }, [cursor, playing, result.events.length, stepDelay]);

  const run = useCallback(() => {
    setCursor((current) => (current < 0 || current >= result.events.length ? 0 : current));
    setPlaying(true);
  }, [result.events.length]);

  const pause = useCallback(() => setPlaying(false), []);
  const step = useCallback(() => {
    setPlaying(false);
    setCursor((current) => advancePooFlowCursor(current, result.events.length));
  }, [result.events.length]);
  const reset = useCallback(() => {
    setPlaying(false);
    setCursor(-1);
    setSelectedId(undefined);
  }, []);

  useEffect(() => {
    let active = true;
    setLayoutedNodes(initialNodes);
    setCursor(-1);
    setPlaying(false);
    void layout(initialNodes, baseEdges).then((nextNodes) => {
      if (active) {
        setLayoutedNodes(nextNodes);
        scheduleFit();
      }
    });
    return () => {
      active = false;
    };
  }, [baseEdges, initialNodes, scheduleFit]);

  return (
    <div
      ref={graphElement}
      className="poo-flow-graph"
      role="img"
      aria-label="Poo Flow workflow execution graph"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodesDraggable={false}
        nodesConnectable={false}
        minZoom={0.2}
        fitView
        onInit={(instance) => {
          flow.current = instance;
          scheduleFit();
        }}
        onNodeClick={(_event, node) => setSelectedId(node.id)}
      >
        <Background gap={20} size={1} />
        <MiniMap pannable zoomable />
        <Controls showInteractive={false} />
        {selectedEvent ? (
          <Panel position="top-right" className="poo-flow-inspector nodrag nopan">
            <button
              type="button"
              aria-label="Close step details"
              onClick={() => setSelectedId(undefined)}
            >
              ×
            </button>
            <small>Selected Scheme step</small>
            <strong>{selectedEvent.label}</strong>
            {selectedEvent.kind ? <code>{selectedEvent.kind}</code> : null}
            {selectedEvent.detail ? <p>{selectedEvent.detail}</p> : null}
          </Panel>
        ) : null}
        <Panel
          position="bottom-center"
          className="poo-flow-runner nodrag nopan"
          role="toolbar"
          aria-label="Workflow execution controls"
        >
          <span className="poo-flow-runner__status" aria-live="polite">
            {cursor < 0
              ? "Ready"
              : cursor >= result.events.length
                ? "Complete"
                : `${playing ? "Running" : "Paused"} · step ${cursor + 1}/${result.events.length}`}
          </span>
          <button
            type="button"
            className="poo-flow-runner__primary"
            onClick={run}
            disabled={playing}
          >
            {cursor >= 0 && cursor < result.events.length ? "Resume" : "Run"}
          </button>
          <button type="button" onClick={pause} disabled={!playing}>
            Pause
          </button>
          <button type="button" onClick={step} disabled={playing || cursor >= result.events.length}>
            Step
          </button>
          <button type="button" onClick={reset}>
            Reset
          </button>
          <label>
            Speed
            <select
              value={stepDelay}
              onChange={(event) => setStepDelay(Number(event.target.value))}
            >
              <option value={1500}>0.5×</option>
              <option value={900}>1×</option>
              <option value={450}>2×</option>
            </select>
          </label>
        </Panel>
      </ReactFlow>
    </div>
  );
}

export function PooFlowGraph(props: { result: PooFlowRunResult }) {
  return <InteractivePooFlowGraph {...props} />;
}
