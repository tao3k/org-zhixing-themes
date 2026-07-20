export const POO_FLOW_GRAPH_SCHEMA_VERSION = 1 as const;

export type PooFlowWorkflowId = string;
export type PooFlowNodeId = string;
export type PooFlowEdgeId = string;
export type PooFlowBreakpointKey = string;

export type PooFlowGraphNodeKind =
  | "composition"
  | "case"
  | "profile-instance"
  | "evidence"
  | "boundary"
  | "step";

export type PooFlowGraphRelationKind =
  | "compose"
  | "step"
  | "handoff"
  | "prove"
  | "evidence"
  | "flow";

export interface PooFlowGraphInputEvent extends PooFlowGraphObjectIdentity {
  readonly id: PooFlowNodeId;
  readonly label: string;
  readonly kind?: string;
  readonly parentId?: PooFlowNodeId;
  readonly sourceId?: PooFlowNodeId;
  readonly relation?: string;
  readonly detail?: string;
}

export interface PooFlowGraphInputEdge {
  readonly id?: string;
  readonly source: string;
  readonly target: string;
  readonly label?: string;
}

export interface PooFlowGraphInput {
  readonly rootId?: string;
  readonly events: readonly PooFlowGraphInputEvent[];
  readonly edges?: readonly PooFlowGraphInputEdge[];
}

export interface PooFlowGraphNode extends PooFlowGraphObjectIdentity {
  readonly id: PooFlowNodeId;
  readonly workflowId: PooFlowWorkflowId;
  readonly kind: PooFlowGraphNodeKind;
  readonly label: string;
  readonly parentId?: PooFlowNodeId;
  readonly sourceId?: PooFlowNodeId;
  readonly relation: PooFlowGraphRelationKind;
  readonly detail?: string;
  readonly executionIndex: number;
  readonly ports: {
    readonly input: "in";
    readonly output: "out";
  };
}

export interface PooFlowGraphConnection {
  readonly id: PooFlowEdgeId;
  readonly workflowId: PooFlowWorkflowId;
  readonly source: PooFlowNodeId;
  readonly target: PooFlowNodeId;
  readonly relation: PooFlowGraphRelationKind;
}

export interface PooFlowGraphProjection {
  readonly schemaVersion: typeof POO_FLOW_GRAPH_SCHEMA_VERSION;
  readonly workflowId: PooFlowWorkflowId;
  readonly rootIds: readonly PooFlowNodeId[];
  readonly nodes: readonly PooFlowGraphNode[];
  readonly connections: readonly PooFlowGraphConnection[];
}

function contractError(code: string, detail: string): Error {
  return new Error(`POO-GRAPH-${code} ${detail}`);
}

export function pooFlowWorkflowId(value: string): PooFlowWorkflowId {
  const normalized = value.trim();
  if (!normalized) throw contractError("E001", "workflow id is empty");
  if (!/^[a-z0-9][a-z0-9._:/-]*$/i.test(normalized)) {
    throw contractError("E002", `workflow id contains unsupported characters: ${normalized}`);
  }
  return normalized as PooFlowWorkflowId;
}

function nodeKind(value: string | undefined): PooFlowGraphNodeKind {
  if (
    value === "composition" ||
    value === "case" ||
    value === "profile-instance" ||
    value === "evidence" ||
    value === "boundary"
  ) {
    return value;
  }
  return "step";
}

function relationKind(value: string | undefined): PooFlowGraphRelationKind {
  if (
    value === "compose" ||
    value === "step" ||
    value === "handoff" ||
    value === "prove" ||
    value === "evidence"
  ) {
    return value;
  }
  return "flow";
}

function assertContainment(nodes: readonly PooFlowGraphNode[], nodeIds: ReadonlySet<string>) {
  const parents = new Map(nodes.map((node) => [node.id, node.parentId]));
  for (const node of nodes) {
    if (node.parentId && !nodeIds.has(node.parentId)) {
      throw contractError("E006", `unknown parent ${node.parentId} for ${node.id}`);
    }
    const visited = new Set([node.id]);
    let parentId = node.parentId;
    while (parentId) {
      if (visited.has(parentId)) {
        throw contractError("E007", `containment cycle reaches ${parentId}`);
      }
      visited.add(parentId);
      parentId = parents.get(parentId);
    }
  }
}

export function createPooFlowGraphProjection(
  workflowIdValue: string,
  input: PooFlowGraphInput,
): PooFlowGraphProjection {
  const workflowId = pooFlowWorkflowId(workflowIdValue);
  if (input.events.length === 0) throw contractError("E003", "graph has no semantic nodes");

  const nodeIds = new Set<string>();
  const nodes = input.events.map<PooFlowGraphNode>((event, executionIndex) => {
    if (!event.id || !event.label) {
      throw contractError("E004", `node ${executionIndex} requires id and label`);
    }
    if (nodeIds.has(event.id)) throw contractError("E005", `duplicate node ${event.id}`);
    nodeIds.add(event.id);
    return {
      id: event.id,
      workflowId,
      kind: nodeKind(event.kind),
      objectForm: event.objectForm,
      objectSubtype: event.objectSubtype,
      scope: event.scope,
      definitionId: event.definitionId,
      instanceId: event.instanceId,
      evidenceRef: event.evidenceRef,
      boundaryType: event.boundaryType,
      capabilities: event.capabilities ?? [],
      conditions: event.conditions ?? [],
      properties: event.properties ?? {},
      states: event.states ?? [],
      label: event.label,
      parentId: event.parentId,
      sourceId: event.sourceId,
      relation: relationKind(event.relation),
      detail: event.detail,
      executionIndex,
      ports: { input: "in", output: "out" },
    };
  });
  nodes.forEach((node, index) => {
    Object.assign(node, { scenario: input.events[index]?.scenario });
  });
  assertContainment(nodes, nodeIds);

  const inputEdges =
    input.edges ??
    nodes.slice(1).map((node, index) => ({
      source: nodes[index].id,
      target: node.id,
      label: node.relation,
    }));
  const connections = inputEdges.map<PooFlowGraphConnection>((edge, index) => {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      throw contractError("E008", `connection ${edge.source} -> ${edge.target} leaves the graph`);
    }
    return {
      id: ("id" in edge ? edge.id : undefined) ?? `${edge.source}-${edge.target}-${index}`,
      workflowId,
      source: edge.source,
      target: edge.target,
      relation: relationKind(edge.label),
    };
  });

  const naturalRoots = nodes.filter((node) => !node.parentId).map((node) => node.id);
  const rootIds = input.rootId ? [input.rootId] : naturalRoots;
  if (rootIds.length === 0 || rootIds.some((rootId) => !nodeIds.has(rootId))) {
    throw contractError("E009", "graph root is missing or unknown");
  }

  return {
    schemaVersion: POO_FLOW_GRAPH_SCHEMA_VERSION,
    workflowId,
    rootIds,
    nodes,
    connections,
  };
}
export type PooFlowGraphObjectForm = "definition" | "instance" | "reference" | "runtime";

export type PooFlowGraphPropertyValue = string | number | boolean | null;

export interface PooFlowGraphProperties {
  definition?: Readonly<Record<string, PooFlowGraphPropertyValue>>;
  inherited?: Readonly<Record<string, PooFlowGraphPropertyValue>>;
  instance?: Readonly<Record<string, PooFlowGraphPropertyValue>>;
}

export type PooFlowGraphConditionKind = "guard" | "precondition" | "predicate" | "blocker" | "exit";

export type PooFlowGraphConditionState = "unknown" | "satisfied" | "unsatisfied" | "blocked";

export interface PooFlowGraphCondition {
  id: string;
  kind: PooFlowGraphConditionKind;
  expression: string;
  state: PooFlowGraphConditionState;
  label?: string;
}

export type PooFlowGraphStateLayer = "definition" | "instance" | "execution" | "assurance";

export interface PooFlowGraphStateFacet {
  layer: PooFlowGraphStateLayer;
  name: string;
  value: string;
  tone?: "neutral" | "active" | "success" | "warning" | "danger";
}

export interface PooFlowGraphObjectIdentity {
  readonly objectForm?: PooFlowGraphObjectForm;
  readonly objectSubtype?: string;
  readonly scope?: string;
  readonly scenario?: string;
  readonly definitionId?: string;
  readonly instanceId?: string;
  readonly evidenceRef?: string;
  readonly boundaryType?: string;
  readonly capabilities?: readonly string[];
  readonly conditions?: readonly PooFlowGraphCondition[];
  readonly properties?: PooFlowGraphProperties;
  readonly states?: readonly PooFlowGraphStateFacet[];
}
