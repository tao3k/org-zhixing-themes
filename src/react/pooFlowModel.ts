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

export interface PooFlowEvent {
  id: string;
  label: string;
  sequence?: bigint | number | string;
  kind?: string;
  state?: PooFlowEventState;
  detail?: string;
}

export interface PooFlowEdge {
  id?: string;
  source: string;
  target: string;
  label?: string;
}

export interface PooFlowRunResult {
  events: readonly PooFlowEvent[];
  edges?: readonly PooFlowEdge[];
}

export interface PooFlowRunner {
  run(source: string, options: { signal: AbortSignal }): Promise<PooFlowRunResult>;
}
