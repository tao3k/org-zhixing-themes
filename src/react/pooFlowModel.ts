export type PooFlowEventState = "pending" | "running" | "completed" | "failed";
export type PooFlowExecutionState = Exclude<PooFlowEventState, "failed">;

export function pooFlowExecutionState(
  index: number,
  cursor: number,
  eventCount: number,
): PooFlowExecutionState {
  if (cursor >= eventCount || index < cursor) return "completed";
  return index === cursor ? "running" : "pending";
}

export function advancePooFlowCursor(cursor: number, eventCount: number): number {
  return Math.min(cursor + 1, eventCount);
}

export interface PooFlowEvent extends PooFlowGraphObjectIdentity {
  id: PooFlowNodeId;
  label: string;
  sequence?: bigint | number | string;
  kind?: string;
  state?: PooFlowEventState;
  detail?: string;
  parentId?: PooFlowNodeId;
  sourceId?: PooFlowNodeId;
  relation?: string;
}

export interface PooFlowEdge {
  id?: PooFlowEdgeId;
  source: PooFlowNodeId;
  target: PooFlowNodeId;
  label?: string;
}

export interface PooFlowRunResult {
  events: readonly PooFlowEvent[];
  edges?: readonly PooFlowEdge[];
  execution?: PooFlowExecutionSession;
  rootId?: string;
}

export interface PooFlowExecutionSnapshot {
  readonly completedSteps: number;
  readonly stepCount: number;
}

export interface PooFlowExecutionSession {
  position(): PooFlowExecutionSnapshot;
  step(): PooFlowExecutionSnapshot;
  reset(): PooFlowExecutionSnapshot;
  release(): void;
}

export interface PooFlowRunner {
  run(
    source: string,
    options: { signal: AbortSignal; workflowId?: string },
  ): Promise<PooFlowRunResult>;
}
import type {
  PooFlowEdgeId,
  PooFlowGraphObjectIdentity,
  PooFlowNodeId,
} from "../poo-flow/graphContract";
