import {
  Background,
  Controls,
  Panel,
  ReactFlow,
  type NodeChange,
  type OnConnect,
  type OnReconnect,
  type ReactFlowInstance,
} from "@xyflow/react";
import type { Dispatch, MutableRefObject, RefObject, SetStateAction } from "react";
import type { PooFlowDebuggerEvent } from "../poo-flow/graphDebugger";
import type { PooFlowGraphProjection } from "../poo-flow/graphContract";
import { pooFlowGraphInteractionPolicy, type PooFlowGraphMode } from "../poo-flow/graphWorkbench";
import type {
  PooFlowTopologyOperation,
  PooFlowTopologyReceipt,
} from "../poo-flow/topologyMutation";
import {
  edgeTypes,
  nodeTypes,
  type PooFlowGraphEdge,
  type PooFlowGraphNode,
} from "./PooFlowGraphRenderers";
import { PooFlowGraphWorkbenchControls } from "./PooFlowGraphWorkbenchControls";
import { PooFlowInspector } from "./PooFlowInspector";
import { responsiveLayoutDirection } from "./pooFlowGraphLayout";
import { pooFlowZoomTier } from "./pooFlowVisibility";

export interface PooFlowGraphViewProps {
  readonly graphElement: RefObject<HTMLDivElement | null>;
  readonly layoutReady: boolean;
  readonly layoutDurationMs: number | undefined;
  readonly interactionMode: PooFlowGraphMode;
  readonly interactionPolicy: ReturnType<typeof pooFlowGraphInteractionPolicy>;
  readonly topologyPending: boolean;
  readonly topologyReceipt: PooFlowTopologyReceipt | undefined;
  readonly selectedId: string | undefined;
  readonly selectedEdgeId: string | undefined;
  readonly closeInspector: () => void;
  readonly nodes: PooFlowGraphNode[];
  readonly edges: PooFlowGraphEdge[];
  readonly projection: PooFlowGraphProjection;
  readonly flow: MutableRefObject<ReactFlowInstance<PooFlowGraphNode, PooFlowGraphEdge> | null>;
  readonly scheduleFit: () => void;
  readonly selectionTrigger: MutableRefObject<HTMLElement | SVGElement | null>;
  readonly setSelectedId: Dispatch<SetStateAction<string | undefined>>;
  readonly setSelectedEdgeId: Dispatch<SetStateAction<string | undefined>>;
  readonly handleNodesChange: (changes: NodeChange<PooFlowGraphNode>[]) => void;
  readonly handleConnect: OnConnect;
  readonly handleReconnect: OnReconnect;
  readonly selectedEvent: PooFlowGraphProjection["nodes"][number] | undefined;
  readonly selectedNode: PooFlowGraphNode | undefined;
  readonly selectedEdge: PooFlowGraphEdge | undefined;
  readonly dispatchDebugger: Dispatch<PooFlowDebuggerEvent>;
  readonly topologyMutable: boolean;
  readonly submitTopologyOperation: (operation: PooFlowTopologyOperation) => Promise<void>;
  readonly setInteractionMode: Dispatch<SetStateAction<PooFlowGraphMode>>;
  readonly cursor: number;
  readonly playing: boolean;
  readonly run: () => void;
  readonly pause: () => void;
  readonly step: () => void;
  readonly reset: () => void;
  readonly stepDelay: number;
  readonly setStepDelay: Dispatch<SetStateAction<number>>;
}

function InteractivePooFlowGraphView({
  graphElement,
  layoutReady,
  layoutDurationMs,
  interactionMode,
  interactionPolicy,
  topologyPending,
  topologyReceipt,
  selectedId,
  selectedEdgeId,
  closeInspector,
  nodes,
  edges,
  projection,
  flow,
  scheduleFit,
  selectionTrigger,
  setSelectedId,
  setSelectedEdgeId,
  handleNodesChange,
  handleConnect,
  handleReconnect,
  selectedEvent,
  selectedNode,
  selectedEdge,
  dispatchDebugger,
  topologyMutable,
  submitTopologyOperation,
  setInteractionMode,
  cursor,
  playing,
  run,
  pause,
  step,
  reset,
  stepDelay,
  setStepDelay,
}: PooFlowGraphViewProps) {
  return (
    <div
      ref={graphElement}
      className="poo-flow-graph"
      data-poo-flow-zoom={pooFlowZoomTier(1)}
      data-poo-flow-layout={layoutReady ? "ready" : "pending"}
      data-poo-flow-layout-ms={layoutDurationMs?.toFixed(2)}
      data-graph-mode={interactionMode}
      data-connectable={interactionPolicy.nodesConnectable}
      data-topology-status={topologyPending ? "pending" : (topologyReceipt?.status ?? "idle")}
      data-topology-reason={topologyReceipt?.reason}
      aria-busy={!layoutReady}
      role="region"
      aria-label="Poo Flow workflow execution graph"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Escape" && (selectedId || selectedEdgeId)) {
          event.preventDefault();
          event.stopPropagation();
          closeInspector();
        }
      }}
    >
      <span className="poo-flow-status-announcement" aria-live="polite">
        {topologyPending
          ? "Applying workflow topology change"
          : topologyReceipt
            ? `Workflow topology change ${topologyReceipt.status}: ${topologyReceipt.reason}`
            : ""}
      </span>
      {layoutReady ? (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          nodesDraggable={interactionPolicy.nodesDraggable}
          nodesConnectable={interactionPolicy.nodesConnectable}
          edgesReconnectable={interactionPolicy.edgesReconnectable}
          deleteKeyCode={interactionPolicy.deleteKeyCode}
          nodesFocusable
          edgesFocusable
          onlyRenderVisibleElements={projection.nodes.length >= 200}
          minZoom={responsiveLayoutDirection() === "DOWN" ? 0.28 : 0.42}
          fitViewOptions={{ padding: 0.12 }}
          proOptions={{ hideAttribution: true }}
          onInit={(instance) => {
            flow.current = instance;
            scheduleFit();
          }}
          onNodeClick={(event, node) => {
            selectionTrigger.current = event.currentTarget as HTMLElement | SVGElement;
            setSelectedEdgeId(undefined);
            setSelectedId(node.id);
          }}
          onEdgeClick={(event, edge) => {
            selectionTrigger.current = event.currentTarget as HTMLElement | SVGElement;
            setSelectedId(undefined);
            setSelectedEdgeId(edge.id);
          }}
          onPaneClick={() => {
            setSelectedId(undefined);
            setSelectedEdgeId(undefined);
          }}
          onNodesChange={handleNodesChange}
          onConnect={handleConnect}
          onReconnect={handleReconnect}
          onMove={(_event, viewport) => {
            graphElement.current?.setAttribute(
              "data-poo-flow-zoom",
              pooFlowZoomTier(viewport.zoom),
            );
          }}
        >
          <Background gap={20} size={1} />
          <Controls showInteractive={false} />
          {selectedEvent || selectedEdge ? (
            <Panel position="top-right" className="poo-flow-inspector nodrag nopan">
              <PooFlowInspector
                node={selectedEvent}
                edge={
                  selectedEdge
                    ? {
                        id: selectedEdge.id,
                        source: selectedEdge.source,
                        target: selectedEdge.target,
                        relation: selectedEdge.data?.relation,
                        state: selectedEdge.className?.includes("running")
                          ? "running"
                          : selectedEdge.className?.includes("completed")
                            ? "completed"
                            : "pending",
                        breakpoint: Boolean(selectedEdge.data?.breakpoint),
                        onToggleBreakpoint: () => {
                          dispatchDebugger({
                            type: "toggle-breakpoint",
                            target: { kind: "edge", id: selectedEdge.id },
                          });
                        },
                        onDisconnect: topologyMutable
                          ? () =>
                              void submitTopologyOperation({
                                kind: "disconnect",
                                edgeId: selectedEdge.id,
                              })
                          : undefined,
                      }
                    : undefined
                }
                runtimeState={selectedNode?.data.state}
                nodeActions={
                  selectedNode
                    ? {
                        breakpoint: Boolean(selectedNode.data.breakpoint),
                        mode: interactionMode,
                        onToggleBreakpoint: () =>
                          selectedNode.data.onToggleBreakpoint?.(selectedNode.id),
                        onRunTo: () => selectedNode.data.onRunTo?.(selectedNode.id),
                      }
                    : undefined
                }
                onClose={closeInspector}
              />
              <strong>{selectedEvent?.label}</strong>
              {selectedEvent?.kind ? <code>{selectedEvent.kind}</code> : null}
              {selectedEvent?.detail ? <p>{selectedEvent.detail}</p> : null}
            </Panel>
          ) : null}
          <PooFlowGraphWorkbenchControls
            mode={interactionMode}
            nodeCount={projection.nodes.length}
            onModeChange={(mode) => {
              setInteractionMode(mode);
              if (mode !== "run") {
                dispatchDebugger({ type: "pause", clearRunTo: true });
              }
            }}
          />
        </ReactFlow>
      ) : (
        <div className="poo-flow-layout-pending" role="status">
          Preparing workflow layout
        </div>
      )}
      <div
        className="poo-flow-runner nodrag nopan"
        role="toolbar"
        aria-label="Workflow execution controls"
      >
        <span className="poo-flow-runner__status" aria-live="polite">
          {cursor < 0
            ? "Ready"
            : cursor >= projection.nodes.length
              ? "Complete"
              : `${playing ? "Running" : "Paused"} · step ${cursor + 1}/${projection.nodes.length}`}
        </span>
        <button type="button" className="poo-flow-runner__primary" onClick={run} disabled={playing}>
          {cursor >= 0 && cursor < projection.nodes.length ? "Resume" : "Run"}
        </button>
        <button type="button" onClick={pause} disabled={!playing}>
          Pause
        </button>
        <button
          type="button"
          onClick={step}
          disabled={!layoutReady || playing || cursor >= projection.nodes.length}
        >
          Step
        </button>
        <button type="button" onClick={reset}>
          Reset
        </button>
        <label>
          Speed
          <select value={stepDelay} onChange={(event) => setStepDelay(Number(event.target.value))}>
            <option value={1500}>0.5×</option>
            <option value={900}>1×</option>
            <option value={450}>2×</option>
          </select>
        </label>
      </div>
    </div>
  );
}

export function PooFlowGraphView(props: PooFlowGraphViewProps) {
  return <InteractivePooFlowGraphView {...props} />;
}
