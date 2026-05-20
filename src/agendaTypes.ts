import type {
  OrgizeAgendaViewCardDto,
  OrgizeAgendaViewSkipDto,
  OrgizeViewIndexRecordDto,
} from "orgize/dto";
import type { AgendaModeKey } from "./config";

export type AgendaPanelKey = "trace" | "selectors" | "source" | "agent" | "records";

export type SuperAgendaTone =
  | "critical"
  | "focus"
  | "deadline"
  | "waiting"
  | "done"
  | "steady"
  | "muted";

export type SuperAgendaComparator = "<=" | "=" | ">=";

export type SuperAgendaTransformerKey =
  | "agent-context-label"
  | "deadline-risk-label"
  | "uppercase-title";

export type SuperAgendaSelector =
  | { kind: "anything" }
  | { kind: "blocked" }
  | { kind: "category"; values: string[] }
  | { kind: "closed" }
  | { kind: "deadline" }
  | { kind: "done" }
  | { kind: "memory" }
  | { kind: "effort"; operator: Exclude<SuperAgendaComparator, "=">; value: string }
  | { kind: "priority"; operator: SuperAgendaComparator; value: string }
  | { kind: "property"; key: string; values?: string[] }
  | { kind: "scheduled" }
  | { kind: "tag"; values: string[] }
  | { kind: "time-grid" }
  | { kind: "todo"; values: string[] }
  | { kind: "and"; selectors: SuperAgendaSelector[] }
  | { kind: "not"; selector: SuperAgendaSelector }
  | { kind: "or"; selectors: SuperAgendaSelector[] }
  | { kind: "take"; count: number; selector: SuperAgendaSelector }
  | { kind: "discard"; selector: SuperAgendaSelector }
  | {
      kind: "auto";
      by: "category" | "planning" | "priority" | "property" | "tags" | "todo";
      property?: string;
    };

export type AgendaCardView = OrgizeAgendaViewCardDto & {
  record: OrgizeViewIndexRecordDto | null;
  signals: string[];
  planning: AgendaPlanningEntry[];
  pressure: SuperAgendaTone;
  agentState: string;
  memorySignals: string[];
};

export type AgendaPlanningEntry = {
  label: "SCHEDULED" | "DEADLINE" | "CLOSED";
  kind: "scheduled" | "deadline" | "closed";
  value: string;
};

export type SuperAgendaProgramRule = {
  id: string;
  title: string;
  subtitle: string;
  selector: SuperAgendaSelector;
  order: number;
  orderMulti?: string;
  tone: SuperAgendaTone;
  face?: string;
  transformer?: SuperAgendaTransformerKey;
};

export type SuperAgendaProgram = {
  key: AgendaModeKey;
  label: string;
  shortLabel: string;
  description: string;
  intent: string;
  source: string;
  rules: SuperAgendaProgramRule[];
};

export type SuperAgendaCapabilityStatus =
  | "native"
  | "parser-backed"
  | "partial"
  | "agent-extension"
  | "planned";

export type SuperAgendaSelectorCapability = {
  id: string;
  selector: string;
  label: string;
  family: "core" | "control" | "auto" | "display" | "advanced" | "agent";
  status: SuperAgendaCapabilityStatus;
  detail: string;
  active: boolean;
};

export type SuperAgendaCapabilitySummary = {
  total: number;
  implemented: number;
  active: number;
  planned: number;
};

export type SuperAgendaGroup = {
  id: string;
  ruleId: string;
  title: string;
  subtitle: string;
  selector: string;
  order: number;
  tone: SuperAgendaTone;
  autoKey: string | null;
  face?: string;
  transformer?: SuperAgendaTransformerKey;
  cards: AgendaCardView[];
};

export type SuperAgendaMetric = {
  label: string;
  value: string;
  detail: string;
  tone: SuperAgendaTone;
};

export type SuperAgendaTraceStep = {
  ruleId: string;
  title: string;
  selector: string;
  order: number;
  tone: SuperAgendaTone;
  operation: "auto" | "discard" | "group" | "take";
  matchedCount: number;
  emittedCount: number;
  consumedCount: number;
  discardedCount: number;
  inputCount: number;
  remainingAfter: number;
  outputTitles: string[];
  note: string;
};

export type SuperAgendaAgentBrief = {
  headline: string;
  summary: string;
  recommendations: string[];
  prompts: string[];
  captureLog: SuperAgendaCaptureEntry[];
};

export type SuperAgendaCaptureEntry = {
  title: string;
  label: string;
  detail: string;
  tone: SuperAgendaTone;
};

export type SuperAgendaSortStep = {
  label: string;
  direction: string;
  detail: string;
};

export type SuperAgendaWorkspace = {
  mode: AgendaModeKey;
  program: SuperAgendaProgram;
  rangeLabel: string;
  totalCandidates: number;
  visibleCount: number;
  skippedCount: number;
  limit: number | null;
  consumedCount: number;
  discardedCount: number;
  unmatchedCount: number;
  insights: string[];
  metrics: SuperAgendaMetric[];
  capabilitySummary: SuperAgendaCapabilitySummary;
  selectorCapabilities: SuperAgendaSelectorCapability[];
  trace: SuperAgendaTraceStep[];
  agentBrief: SuperAgendaAgentBrief;
  sortSteps: SuperAgendaSortStep[];
  groups: SuperAgendaGroup[];
  skipped: OrgizeAgendaViewSkipDto[];
};
