import { MiniMap, Panel, type Node } from "@xyflow/react";
import { useEffect, useState } from "react";
import type { PooFlowGraphMode } from "../poo-flow/graphWorkbench";

interface PooFlowGraphWorkbenchControlsProps {
  readonly mode: PooFlowGraphMode;
  readonly nodeCount: number;
  readonly onModeChange: (mode: PooFlowGraphMode) => void;
}

const modeLabels: ReadonlyArray<readonly [PooFlowGraphMode, string]> = [
  ["explore", "Explore"],
  ["run", "Run"],
  ["compose", "Compose"],
];

function minimapNodeColor(node: Node): string {
  switch (node.type) {
    case "case":
      return "#a78bfa";
    case "profile":
      return "#5eead4";
    case "evidence":
      return "#7dd3fc";
    case "composition":
      return "#93c5fd";
    default:
      return "#94a3b8";
  }
}

export function PooFlowGraphWorkbenchControls({
  mode,
  nodeCount,
  onModeChange,
}: PooFlowGraphWorkbenchControlsProps) {
  const [minimapVisible, setMinimapVisible] = useState(nodeCount >= 50);

  useEffect(() => {
    if (nodeCount >= 50) setMinimapVisible(true);
  }, [nodeCount]);

  return (
    <>
      <Panel position="top-left" className="poo-flow-workbench-panel nodrag nopan">
        <div className="poo-flow-mode-switch" role="group" aria-label="Graph mode">
          {modeLabels.map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={mode === value}
              data-mode={value}
              onClick={() => onModeChange(value)}
              title={
                value === "compose" ? "Compose emits typed Scheme topology intents" : undefined
              }
            >
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="poo-flow-minimap-toggle"
          aria-pressed={minimapVisible}
          aria-label={`${minimapVisible ? "Hide" : "Show"} semantic minimap`}
          onClick={() => setMinimapVisible((visible) => !visible)}
        >
          Map
        </button>
      </Panel>
      {minimapVisible ? (
        <MiniMap
          ariaLabel="POO Flow semantic map"
          pannable
          zoomable
          position="bottom-right"
          nodeColor={minimapNodeColor}
          nodeStrokeColor="rgba(15, 23, 42, 0.9)"
          nodeStrokeWidth={2}
          maskColor="rgba(15, 23, 42, 0.62)"
          className="poo-flow-semantic-minimap"
        />
      ) : null}
    </>
  );
}
