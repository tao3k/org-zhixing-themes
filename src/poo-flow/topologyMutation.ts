export const POO_FLOW_TOPOLOGY_INTENT_SCHEMA = "poo-flow.graph-topology-intent.v1" as const;
export const POO_FLOW_TOPOLOGY_RECEIPT_SCHEMA = "poo-flow.graph-topology-receipt.v1" as const;

export type PooFlowTopologyOperation =
  | {
      kind: "connect";
      edgeId: string;
      source: string;
      target: string;
      sourceHandle?: string | null;
      targetHandle?: string | null;
    }
  | { kind: "disconnect"; edgeId: string }
  | {
      kind: "reconnect";
      edgeId: string;
      source: string;
      target: string;
      sourceHandle?: string | null;
      targetHandle?: string | null;
    };

export interface PooFlowTopologyIntent {
  schema: typeof POO_FLOW_TOPOLOGY_INTENT_SCHEMA;
  intentId: string;
  workflowId: string;
  expectedRevision: string;
  operation: PooFlowTopologyOperation;
}

export interface PooFlowTopologyReceipt {
  schema: typeof POO_FLOW_TOPOLOGY_RECEIPT_SCHEMA;
  intentId: string;
  workflowId: string;
  status: "applied" | "rejected";
  revision: string;
  reason:
    | "applied"
    | "capability-unavailable"
    | "invalid-intent"
    | "revision-conflict"
    | "adapter-rejected"
    | "invalid-receipt"
    | "invalid-reload";
  detail?: string;
}

export interface PooFlowTopologyNodeReference {
  id: string;
}

export interface PooFlowTopologyEdgeReference {
  id: string;
  source: string;
  target: string;
}

export interface PooFlowTopologyProjection<
  Node extends PooFlowTopologyNodeReference = PooFlowTopologyNodeReference,
  Edge extends PooFlowTopologyEdgeReference = PooFlowTopologyEdgeReference,
> {
  workflowId: string;
  revision: string;
  nodes: readonly Node[];
  edges: readonly Edge[];
}

export interface PooFlowTopologyCapabilities {
  connect: boolean;
  disconnect: boolean;
  reconnect: boolean;
}

export interface PooFlowTopologyMutationAdapter<
  Projection extends PooFlowTopologyProjection = PooFlowTopologyProjection,
> {
  capabilities: PooFlowTopologyCapabilities;
  reload(workflowId: string): Promise<Projection>;
  apply(intent: PooFlowTopologyIntent): Promise<PooFlowTopologyReceipt>;
}

export interface PooFlowTopologyMutationResult<
  Projection extends PooFlowTopologyProjection = PooFlowTopologyProjection,
> {
  receipt: PooFlowTopologyReceipt;
  projection?: Projection;
}

const rejectedReceipt = (
  intent: PooFlowTopologyIntent,
  revision: string,
  reason: Exclude<PooFlowTopologyReceipt["reason"], "applied">,
  detail: string,
): PooFlowTopologyReceipt => ({
  schema: POO_FLOW_TOPOLOGY_RECEIPT_SCHEMA,
  intentId: intent.intentId,
  workflowId: intent.workflowId,
  status: "rejected",
  revision,
  reason,
  detail,
});

const operationCapability = (operation: PooFlowTopologyOperation) => operation.kind;

export const validatePooFlowTopologyProjection = (
  projection: PooFlowTopologyProjection,
): string | undefined => {
  if (!projection.workflowId || !projection.revision) return "projection identity is missing";
  const nodeIds = new Set(projection.nodes.map(({ id }) => id));
  if (nodeIds.size !== projection.nodes.length || nodeIds.has("")) {
    return "projection node identifiers must be unique and non-empty";
  }
  const edgeIds = new Set<string>();
  for (const edge of projection.edges) {
    if (!edge.id || edgeIds.has(edge.id))
      return "projection edge identifiers must be unique and non-empty";
    edgeIds.add(edge.id);
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      return `edge ${edge.id} references an unknown endpoint`;
    }
  }
  return undefined;
};

export const validatePooFlowTopologyIntent = (
  intent: PooFlowTopologyIntent,
  projection: PooFlowTopologyProjection,
): string | undefined => {
  if (intent.schema !== POO_FLOW_TOPOLOGY_INTENT_SCHEMA) return "intent schema is unsupported";
  if (!intent.intentId || !intent.workflowId || !intent.expectedRevision) {
    return "intent identity is missing";
  }
  if (intent.workflowId !== projection.workflowId)
    return "intent workflow does not match projection";
  if (intent.expectedRevision !== projection.revision)
    return "intent revision does not match projection";
  const nodeIds = new Set(projection.nodes.map(({ id }) => id));
  const edgeIds = new Set(projection.edges.map(({ id }) => id));
  const { operation } = intent;
  if (!operation.edgeId) return "operation edge identifier is missing";
  if (operation.kind === "disconnect") {
    return edgeIds.has(operation.edgeId) ? undefined : `edge ${operation.edgeId} does not exist`;
  }
  if (!nodeIds.has(operation.source) || !nodeIds.has(operation.target)) {
    return "operation references an unknown endpoint";
  }
  if (operation.source === operation.target) return "self connections are not allowed";
  if (operation.kind === "connect" && edgeIds.has(operation.edgeId)) {
    return `edge ${operation.edgeId} already exists`;
  }
  if (operation.kind === "reconnect" && !edgeIds.has(operation.edgeId)) {
    return `edge ${operation.edgeId} does not exist`;
  }
  return undefined;
};

type TopologyStage<Projection extends PooFlowTopologyProjection, Value> =
  | { readonly ok: true; readonly value: Value }
  | { readonly ok: false; readonly result: PooFlowTopologyMutationResult<Projection> };

const rejectedResult = <Projection extends PooFlowTopologyProjection>(
  intent: PooFlowTopologyIntent,
  revision: string,
  reason: Exclude<PooFlowTopologyReceipt["reason"], "applied">,
  detail: string,
): PooFlowTopologyMutationResult<Projection> => ({
  receipt: rejectedReceipt(intent, revision, reason, detail),
});

const reloadTopology = async <Projection extends PooFlowTopologyProjection>(
  adapter: PooFlowTopologyMutationAdapter<Projection>,
  intent: PooFlowTopologyIntent,
  revision: string,
  failureReason: "adapter-rejected" | "invalid-reload",
): Promise<TopologyStage<Projection, Projection>> => {
  try {
    return { ok: true, value: await adapter.reload(intent.workflowId) };
  } catch (error) {
    return {
      ok: false,
      result: rejectedResult(
        intent,
        revision,
        failureReason,
        error instanceof Error ? error.message : "adapter reload failed",
      ),
    };
  }
};

const applyTopologyIntent = async <Projection extends PooFlowTopologyProjection>(
  adapter: PooFlowTopologyMutationAdapter<Projection>,
  intent: PooFlowTopologyIntent,
  revision: string,
): Promise<TopologyStage<Projection, PooFlowTopologyReceipt>> => {
  try {
    return { ok: true, value: await adapter.apply(intent) };
  } catch (error) {
    return {
      ok: false,
      result: rejectedResult(
        intent,
        revision,
        "adapter-rejected",
        error instanceof Error ? error.message : "adapter apply failed",
      ),
    };
  }
};

const receiptMatchesIntent = (
  receipt: PooFlowTopologyReceipt,
  intent: PooFlowTopologyIntent,
): boolean =>
  receipt.schema === POO_FLOW_TOPOLOGY_RECEIPT_SCHEMA &&
  receipt.intentId === intent.intentId &&
  receipt.workflowId === intent.workflowId;

export const executePooFlowTopologyMutation = async <Projection extends PooFlowTopologyProjection>(
  adapter: PooFlowTopologyMutationAdapter<Projection>,
  intent: PooFlowTopologyIntent,
): Promise<PooFlowTopologyMutationResult<Projection>> => {
  const beforeStage = await reloadTopology(
    adapter,
    intent,
    intent.expectedRevision,
    "adapter-rejected",
  );
  if (!beforeStage.ok) return beforeStage.result;
  const before = beforeStage.value;
  const invalidProjection = validatePooFlowTopologyProjection(before);
  if (invalidProjection)
    return rejectedResult(intent, before.revision, "invalid-reload", invalidProjection);
  if (!adapter.capabilities[operationCapability(intent.operation)]) {
    return rejectedResult(
      intent,
      before.revision,
      "capability-unavailable",
      `${intent.operation.kind} is not supported by this adapter`,
    );
  }
  const invalidIntent = validatePooFlowTopologyIntent(intent, before);
  if (invalidIntent) {
    const reason =
      intent.expectedRevision === before.revision ? "invalid-intent" : "revision-conflict";
    return rejectedResult(intent, before.revision, reason, invalidIntent);
  }
  const applyStage = await applyTopologyIntent(adapter, intent, before.revision);
  if (!applyStage.ok) return applyStage.result;
  const receipt = applyStage.value;
  if (!receiptMatchesIntent(receipt, intent)) {
    return rejectedResult(
      intent,
      before.revision,
      "invalid-receipt",
      "adapter receipt identity mismatch",
    );
  }
  if (receipt.status !== "applied") return { receipt };
  const afterStage = await reloadTopology(adapter, intent, receipt.revision, "invalid-reload");
  if (!afterStage.ok) return afterStage.result;
  const projection = afterStage.value;
  const invalidReload = validatePooFlowTopologyProjection(projection);
  if (invalidReload || projection.revision !== receipt.revision) {
    return rejectedResult(
      intent,
      projection.revision,
      "invalid-reload",
      invalidReload ?? "reloaded revision does not match the applied receipt",
    );
  }
  return { receipt, projection };
};
