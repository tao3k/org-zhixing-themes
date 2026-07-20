export type PooFlowGraphMode = "explore" | "run" | "compose";

export interface PooFlowGraphInteractionCapabilities {
  readonly typedTopologyMutations: boolean;
}

export interface PooFlowGraphInteractionPolicy {
  readonly nodesDraggable: boolean;
  readonly nodesConnectable: boolean;
  readonly edgesReconnectable: boolean;
  readonly elementsDeletable: boolean;
  readonly deleteKeyCode: null;
  readonly runtimeControlsVisible: boolean;
  readonly topologyIntentControlsVisible: boolean;
}

export function pooFlowGraphInteractionPolicy(
  mode: PooFlowGraphMode,
  capabilities: PooFlowGraphInteractionCapabilities = {
    typedTopologyMutations: false,
  },
): PooFlowGraphInteractionPolicy {
  const topologyEnabled = mode === "compose" && capabilities.typedTopologyMutations;
  return {
    nodesDraggable: true,
    nodesConnectable: topologyEnabled,
    edgesReconnectable: topologyEnabled,
    elementsDeletable: false,
    deleteKeyCode: null,
    runtimeControlsVisible: mode === "run",
    topologyIntentControlsVisible: mode === "compose",
  };
}

export type PooFlowBreakpointTarget =
  | { readonly kind: "node"; readonly id: string }
  | { readonly kind: "edge"; readonly id: string };

export function pooFlowBreakpointKey(target: PooFlowBreakpointTarget): string {
  return `${target.kind}:${target.id}`;
}

export function togglePooFlowBreakpoint(
  breakpoints: ReadonlySet<string>,
  target: PooFlowBreakpointTarget,
): ReadonlySet<string> {
  const next = new Set(breakpoints);
  const key = pooFlowBreakpointKey(target);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  return next;
}

export function hasPooFlowBreakpoint(
  breakpoints: ReadonlySet<string>,
  target: PooFlowBreakpointTarget,
): boolean {
  return breakpoints.has(pooFlowBreakpointKey(target));
}

export const POO_FLOW_COMPOUND_SCENARIOS = [
  "subagent-workflow",
  "funflow",
  "parallel-agent-team",
  "transaction-scope",
  "supervision-scope",
] as const;

export type PooFlowCompoundScenario = (typeof POO_FLOW_COMPOUND_SCENARIOS)[number];

export interface PooFlowSubflowProjectionNode {
  readonly id: string;
  readonly parentId?: string;
  readonly scenario?: string;
}

export function isPooFlowCompoundScenario(
  scenario: string | undefined,
): scenario is PooFlowCompoundScenario {
  return POO_FLOW_COMPOUND_SCENARIOS.some((candidate) => candidate === scenario);
}

export function pooFlowNativeParentId(
  node: PooFlowSubflowProjectionNode,
  nodesById: ReadonlyMap<string, PooFlowSubflowProjectionNode>,
): string | undefined {
  if (!node.parentId) return undefined;
  const parent = nodesById.get(node.parentId);
  return parent && isPooFlowCompoundScenario(parent.scenario) ? parent.id : undefined;
}
