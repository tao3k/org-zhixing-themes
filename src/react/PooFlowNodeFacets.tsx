import type {
  PooFlowGraphCondition,
  PooFlowGraphObjectIdentity,
  PooFlowGraphStateFacet,
} from "../poo-flow/graphContract";

export interface PooFlowNodeFacetsProps {
  readonly event: PooFlowGraphObjectIdentity;
}

function activeCondition(
  conditions: readonly PooFlowGraphCondition[] | undefined,
): PooFlowGraphCondition | undefined {
  return (
    conditions?.find(({ state }) => state === "blocked" || state === "unsatisfied") ??
    conditions?.[0]
  );
}

function visibleStates(
  states: readonly PooFlowGraphStateFacet[] | undefined,
): readonly PooFlowGraphStateFacet[] {
  return (
    states?.filter(({ layer }) => layer === "instance" || layer === "assurance").slice(0, 2) ?? []
  );
}

export function PooFlowNodeFacets({ event }: PooFlowNodeFacetsProps) {
  const condition = activeCondition(event.conditions);
  const states = visibleStates(event.states);

  if (!condition && states.length === 0) {
    return null;
  }

  return (
    <span className="poo-flow-node-facets" aria-label="Projected object state and properties">
      {condition ? (
        <span
          className="poo-flow-node-facet poo-flow-node-facet--condition"
          data-condition-state={condition.state}
          title={condition.expression}
        >
          {condition.label ?? condition.kind}
        </span>
      ) : null}
      {states.map((state) => (
        <span
          className="poo-flow-node-facet poo-flow-node-facet--state"
          data-tone={state.tone ?? "neutral"}
          key={`${state.layer}:${state.name}`}
          title={`${state.layer} state`}
        >
          {state.name}: {state.value}
        </span>
      ))}
    </span>
  );
}
