import { GitCommit } from "@phosphor-icons/react/dist/csr/GitCommit";
import { ShieldCheck } from "@phosphor-icons/react/dist/csr/ShieldCheck";
import { SlidersHorizontal } from "@phosphor-icons/react/dist/csr/SlidersHorizontal";
import { X } from "@phosphor-icons/react/dist/csr/X";
import type { PooFlowGraphNode } from "../poo-flow/graphContract";

export interface PooFlowInspectorEdge {
  readonly id: string;
  readonly source: string;
  readonly target: string;
  readonly relation?: string;
  readonly state: "pending" | "running" | "completed";
  readonly breakpoint?: boolean;
  readonly onToggleBreakpoint?: () => void;
  readonly onDisconnect?: () => void;
}

export interface PooFlowInspectorProps {
  readonly node?: PooFlowGraphNode;
  readonly edge?: PooFlowInspectorEdge;
  readonly runtimeState?: "pending" | "running" | "completed";
  readonly nodeActions?: {
    readonly breakpoint: boolean;
    readonly mode: "explore" | "run" | "compose";
    readonly onToggleBreakpoint: () => void;
    readonly onRunTo: () => void;
  };
  readonly onClose: () => void;
}

function propertyEntries(node: PooFlowGraphNode) {
  return (["definition", "inherited", "instance"] as const)
    .map((layer) => ({ layer, entries: Object.entries(node.properties?.[layer] ?? {}) }))
    .filter(({ entries }) => entries.length > 0);
}

export function PooFlowInspector(props: PooFlowInspectorProps) {
  return <InteractivePooFlowInspector {...props} />;
}

function InteractivePooFlowInspector({
  node,
  edge,
  runtimeState,
  nodeActions,
  onClose,
}: PooFlowInspectorProps) {
  if (!node && !edge) return null;

  if (edge) {
    return (
      <section className="poo-flow-inspector__content" aria-label="Checkpoint inspector">
        <header className="poo-flow-inspector__header">
          <span className="poo-flow-inspector__eyebrow">
            <GitCommit aria-hidden="true" weight="duotone" /> Checkpoint
          </span>
          <button type="button" aria-label="Close checkpoint details" onClick={onClose}>
            <X aria-hidden="true" />
          </button>
        </header>
        <strong className="poo-flow-inspector__title">
          {edge.relation ?? "Execution handoff"}
        </strong>
        <div className="poo-flow-inspector__route">
          <code>{edge.source}</code>
          <span aria-hidden="true">→</span>
          <code>{edge.target}</code>
        </div>
        <dl className="poo-flow-inspector__facts">
          <div>
            <dt>State</dt>
            <dd data-state={edge.state}>{edge.state}</dd>
          </div>
          <div>
            <dt>Edge</dt>
            <dd>{edge.id}</dd>
          </div>
        </dl>
        {edge.onToggleBreakpoint || edge.onDisconnect ? (
          <div className="poo-flow-inspector__actions">
            {edge.onToggleBreakpoint ? (
              <button
                type="button"
                className="poo-flow-inspector__action"
                aria-label={`${edge.breakpoint ? "Remove" : "Add"} checkpoint breakpoint ${edge.relation ?? edge.id}`}
                aria-pressed={edge.breakpoint}
                onClick={edge.onToggleBreakpoint}
              >
                {edge.breakpoint ? "Remove breakpoint" : "Add breakpoint"}
              </button>
            ) : null}
            {edge.onDisconnect ? (
              <button
                type="button"
                className="poo-flow-inspector__action"
                aria-label={`Disconnect checkpoint ${edge.relation ?? edge.id}`}
                onClick={edge.onDisconnect}
              >
                Disconnect
              </button>
            ) : null}
          </div>
        ) : null}
      </section>
    );
  }

  if (!node) return null;
  const properties = propertyEntries(node);

  return (
    <section className="poo-flow-inspector__content" aria-label="Scheme object inspector">
      <header className="poo-flow-inspector__header">
        <span className="poo-flow-inspector__eyebrow">
          <SlidersHorizontal aria-hidden="true" weight="duotone" /> Scheme object
        </span>
        <button type="button" aria-label="Close object details" onClick={onClose}>
          <X aria-hidden="true" />
        </button>
      </header>
      <strong className="poo-flow-inspector__title">{node.label}</strong>
      <div className="poo-flow-inspector__summary">
        <code>{node.kind}</code>
        <span data-state={runtimeState ?? "pending"}>{runtimeState ?? "pending"}</span>
      </div>

      <dl className="poo-flow-inspector__facts">
        {node.objectSubtype ? (
          <div>
            <dt>Type</dt>
            <dd>{node.objectSubtype}</dd>
          </div>
        ) : null}
        {node.scope ? (
          <div>
            <dt>Scope</dt>
            <dd>{node.scope}</dd>
          </div>
        ) : null}
        {node.sourceId ? (
          <div>
            <dt>Source</dt>
            <dd>{node.sourceId}</dd>
          </div>
        ) : null}
        {node.definitionId ? (
          <div>
            <dt>Definition</dt>
            <dd>{node.definitionId}</dd>
          </div>
        ) : null}
        {node.instanceId ? (
          <div>
            <dt>Instance</dt>
            <dd>{node.instanceId}</dd>
          </div>
        ) : null}
      </dl>

      {node.conditions?.length ? (
        <section className="poo-flow-inspector__section">
          <h4>
            <ShieldCheck aria-hidden="true" weight="duotone" /> Conditions
          </h4>
          <ul>
            {node.conditions.map((condition) => (
              <li key={condition.id} data-state={condition.state}>
                <span>{condition.label ?? condition.kind}</span>
                <code>{condition.expression}</code>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {node.states?.length ? (
        <section className="poo-flow-inspector__section">
          <h4>State layers</h4>
          <dl className="poo-flow-inspector__properties">
            {node.states.map((state) => (
              <div key={`${state.layer}:${state.name}`}>
                <dt>
                  {state.layer} · {state.name}
                </dt>
                <dd data-tone={state.tone ?? "neutral"}>{state.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      {properties.map(({ layer, entries }) => (
        <section className="poo-flow-inspector__section" key={layer}>
          <h4>{layer} properties</h4>
          <dl className="poo-flow-inspector__properties">
            {entries.map(([name, value]) => (
              <div key={name}>
                <dt>{name}</dt>
                <dd>{String(value)}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}

      {node.capabilities?.length ? (
        <section className="poo-flow-inspector__section">
          <h4>Capabilities</h4>
          <div className="poo-flow-inspector__capabilities">
            {node.capabilities.map((capability) => (
              <span key={capability}>{capability}</span>
            ))}
          </div>
        </section>
      ) : null}

      {node.detail ? <p className="poo-flow-inspector__detail">{node.detail}</p> : null}
      {nodeActions ? (
        <div className="poo-flow-inspector__actions">
          <button
            type="button"
            className="poo-flow-inspector__action"
            aria-label={`${nodeActions.breakpoint ? "Remove" : "Add"} breakpoint ${node.label}`}
            aria-pressed={nodeActions.breakpoint}
            onClick={nodeActions.onToggleBreakpoint}
          >
            {nodeActions.breakpoint ? "Remove breakpoint" : "Add breakpoint"}
          </button>
          <button
            type="button"
            className="poo-flow-inspector__action"
            aria-label={`Run to ${node.label}`}
            disabled={nodeActions.mode !== "run"}
            onClick={nodeActions.onRunTo}
          >
            Run to here
          </button>
        </div>
      ) : null}
    </section>
  );
}
