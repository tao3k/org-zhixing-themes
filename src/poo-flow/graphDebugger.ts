import { pooFlowBreakpointKey, togglePooFlowBreakpoint } from "./graphWorkbench";
import type {
  PooFlowBreakpointKey,
  PooFlowEdgeId,
  PooFlowNodeId,
  PooFlowWorkflowId,
} from "./graphContract";

export type PooFlowDebuggerBreakpointTarget =
  | { readonly kind: "node"; readonly id: PooFlowNodeId }
  | { readonly kind: "edge"; readonly id: PooFlowEdgeId };

export type PooFlowDebuggerStatus = "ready" | "running" | "paused" | "complete";

export interface PooFlowDebuggerReceipt {
  readonly schemaVersion: "poo-flow.graph-debugger-receipt.v1";
  readonly workflowId: PooFlowWorkflowId;
  readonly transition: PooFlowDebuggerEvent["type"];
  readonly fromCursor: number;
  readonly toCursor: number;
  readonly state: PooFlowDebuggerStatus;
  readonly reason:
    | "user"
    | "run-to"
    | "node-breakpoint"
    | "edge-breakpoint"
    | "end"
    | "reset"
    | "workflow-replaced";
  readonly breakpointKey?: PooFlowBreakpointKey;
  readonly runToNodeId?: PooFlowNodeId;
}

export interface PooFlowDebuggerState {
  readonly workflowId: PooFlowWorkflowId;
  readonly cursor: number;
  readonly playing: boolean;
  readonly breakpoints: ReadonlySet<PooFlowBreakpointKey>;
  readonly runToNodeId?: PooFlowNodeId;
  readonly pausedBreakpointKey?: PooFlowBreakpointKey;
  readonly lastReceipt?: PooFlowDebuggerReceipt;
}

export type PooFlowDebuggerEvent =
  | { readonly type: "run"; readonly cursor: number; readonly stepCount: number }
  | { readonly type: "run-to"; readonly nodeId: PooFlowNodeId }
  | {
      readonly type: "cursor-advanced";
      readonly cursor: number;
      readonly activeNodeId?: PooFlowNodeId;
      readonly incomingEdgeIds?: readonly string[];
      readonly stepCount: number;
      readonly source: "timer" | "step";
    }
  | { readonly type: "pause"; readonly clearRunTo?: boolean }
  | { readonly type: "toggle-breakpoint"; readonly target: PooFlowDebuggerBreakpointTarget }
  | { readonly type: "reset"; readonly preserveBreakpoints: boolean }
  | {
      readonly type: "workflow-replaced";
      readonly workflowId: PooFlowWorkflowId;
      readonly validBreakpointKeys: ReadonlySet<PooFlowBreakpointKey>;
    };

export interface PooFlowDebuggerSnapshot {
  readonly schemaVersion: "poo-flow.graph-debugger-snapshot.v1";
  readonly workflowId: string;
  readonly cursor: number;
  readonly breakpoints: readonly string[];
}

export function createPooFlowDebuggerState(workflowId: string): PooFlowDebuggerState {
  return {
    workflowId,
    cursor: -1,
    playing: false,
    breakpoints: new Set(),
  };
}

function status(cursor: number, playing: boolean, stepCount?: number): PooFlowDebuggerStatus {
  if (cursor < 0) return "ready";
  if (stepCount !== undefined && cursor >= stepCount) return "complete";
  return playing ? "running" : "paused";
}

function receipt(
  state: PooFlowDebuggerState,
  event: PooFlowDebuggerEvent,
  next: Pick<PooFlowDebuggerState, "cursor" | "playing">,
  reason: PooFlowDebuggerReceipt["reason"],
  options: {
    readonly stepCount?: number;
    readonly breakpointKey?: string;
    readonly runToNodeId?: string;
  } = {},
): PooFlowDebuggerReceipt {
  return {
    schemaVersion: "poo-flow.graph-debugger-receipt.v1",
    workflowId: event.type === "workflow-replaced" ? event.workflowId : state.workflowId,
    transition: event.type,
    fromCursor: state.cursor,
    toCursor: next.cursor,
    state: status(next.cursor, next.playing, options.stepCount),
    reason,
    breakpointKey: options.breakpointKey,
    runToNodeId: options.runToNodeId,
  };
}

type DebuggerEvent<Type extends PooFlowDebuggerEvent["type"]> = Extract<
  PooFlowDebuggerEvent,
  { readonly type: Type }
>;

function transitionRun(
  state: PooFlowDebuggerState,
  event: DebuggerEvent<"run">,
): PooFlowDebuggerState {
  const cursor = event.cursor >= event.stepCount ? -1 : Math.max(-1, event.cursor);
  const next = { ...state, cursor, playing: true, runToNodeId: undefined };
  return {
    ...next,
    lastReceipt: receipt(state, event, next, "user", { stepCount: event.stepCount }),
  };
}

function transitionRunTo(
  state: PooFlowDebuggerState,
  event: DebuggerEvent<"run-to">,
): PooFlowDebuggerState {
  const next = { ...state, playing: true, runToNodeId: event.nodeId };
  return {
    ...next,
    lastReceipt: receipt(state, event, next, "user", { runToNodeId: event.nodeId }),
  };
}

function transitionCursorAdvanced(
  state: PooFlowDebuggerState,
  event: DebuggerEvent<"cursor-advanced">,
): PooFlowDebuggerState {
  if (event.cursor >= event.stepCount) {
    const next = {
      ...state,
      cursor: event.cursor,
      playing: false,
      runToNodeId: undefined,
      pausedBreakpointKey: undefined,
    };
    return {
      ...next,
      lastReceipt: receipt(state, event, next, "end", { stepCount: event.stepCount }),
    };
  }

  const runToHit = Boolean(state.runToNodeId && event.activeNodeId === state.runToNodeId);
  const nodeKey = event.activeNodeId ? `node:${event.activeNodeId}` : undefined;
  const edgeKey = event.incomingEdgeIds
    ?.map((id) => `edge:${id}`)
    .find((key) => state.breakpoints.has(key));
  const breakpointKey = nodeKey && state.breakpoints.has(nodeKey) ? nodeKey : edgeKey;
  const freshBreakpoint =
    breakpointKey && breakpointKey !== state.pausedBreakpointKey ? breakpointKey : undefined;
  const playing = !(runToHit || freshBreakpoint || event.source === "step");
  const next = {
    ...state,
    cursor: event.cursor,
    playing,
    runToNodeId: runToHit ? undefined : state.runToNodeId,
    pausedBreakpointKey:
      freshBreakpoint ??
      (breakpointKey === state.pausedBreakpointKey ? state.pausedBreakpointKey : undefined),
  };
  const reason = runToHit
    ? "run-to"
    : freshBreakpoint?.startsWith("node:")
      ? "node-breakpoint"
      : freshBreakpoint
        ? "edge-breakpoint"
        : "user";
  return {
    ...next,
    lastReceipt: receipt(state, event, next, reason, {
      stepCount: event.stepCount,
      breakpointKey: freshBreakpoint,
      runToNodeId: runToHit ? state.runToNodeId : undefined,
    }),
  };
}

function transitionPause(
  state: PooFlowDebuggerState,
  event: DebuggerEvent<"pause">,
): PooFlowDebuggerState {
  const next = {
    ...state,
    playing: false,
    runToNodeId: event.clearRunTo ? undefined : state.runToNodeId,
  };
  return { ...next, lastReceipt: receipt(state, event, next, "user") };
}

function transitionToggleBreakpoint(
  state: PooFlowDebuggerState,
  event: DebuggerEvent<"toggle-breakpoint">,
): PooFlowDebuggerState {
  const next = {
    ...state,
    breakpoints: togglePooFlowBreakpoint(state.breakpoints, event.target),
  };
  return { ...next, lastReceipt: receipt(state, event, next, "user") };
}

function transitionReset(
  state: PooFlowDebuggerState,
  event: DebuggerEvent<"reset">,
): PooFlowDebuggerState {
  const next = {
    ...state,
    cursor: -1,
    playing: false,
    breakpoints: event.preserveBreakpoints ? state.breakpoints : new Set<string>(),
    runToNodeId: undefined,
    pausedBreakpointKey: undefined,
  };
  return { ...next, lastReceipt: receipt(state, event, next, "reset") };
}

function transitionWorkflowReplaced(
  state: PooFlowDebuggerState,
  event: DebuggerEvent<"workflow-replaced">,
): PooFlowDebuggerState {
  const breakpoints = new Set(
    [...state.breakpoints].filter((key) => event.validBreakpointKeys.has(key)),
  );
  const next = {
    ...state,
    workflowId: event.workflowId,
    cursor: -1,
    playing: false,
    breakpoints,
    runToNodeId: undefined,
    pausedBreakpointKey: undefined,
  };
  return {
    ...next,
    lastReceipt: receipt(state, event, next, "workflow-replaced"),
  };
}

export function transitionPooFlowDebugger(
  state: PooFlowDebuggerState,
  event: PooFlowDebuggerEvent,
): PooFlowDebuggerState {
  switch (event.type) {
    case "run":
      return transitionRun(state, event);
    case "run-to":
      return transitionRunTo(state, event);
    case "cursor-advanced":
      return transitionCursorAdvanced(state, event);
    case "pause":
      return transitionPause(state, event);
    case "toggle-breakpoint":
      return transitionToggleBreakpoint(state, event);
    case "reset":
      return transitionReset(state, event);
    case "workflow-replaced":
      return transitionWorkflowReplaced(state, event);
  }
}

export function snapshotPooFlowDebugger(state: PooFlowDebuggerState): PooFlowDebuggerSnapshot {
  return {
    schemaVersion: "poo-flow.graph-debugger-snapshot.v1",
    workflowId: state.workflowId,
    cursor: state.cursor,
    breakpoints: [...state.breakpoints].sort(),
  };
}

export function restorePooFlowDebugger(
  snapshot: PooFlowDebuggerSnapshot,
  validBreakpointKeys: ReadonlySet<string>,
  stepCount: number,
): PooFlowDebuggerState {
  return {
    workflowId: snapshot.workflowId,
    cursor: Math.min(Math.max(snapshot.cursor, -1), stepCount),
    playing: false,
    breakpoints: new Set(snapshot.breakpoints.filter((key) => validBreakpointKeys.has(key))),
  };
}

export function validPooFlowBreakpointKeys(
  nodeIds: readonly string[],
  edgeIds: readonly string[],
): ReadonlySet<string> {
  return new Set([
    ...nodeIds.map((id) => pooFlowBreakpointKey({ kind: "node", id })),
    ...edgeIds.map((id) => pooFlowBreakpointKey({ kind: "edge", id })),
  ]);
}
