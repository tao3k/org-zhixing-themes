import type {
  OrgizeAgendaViewCardDto,
  OrgizeAgendaViewSkipDto,
  OrgizeViewIndexRecordDto,
} from "orgize/dto";
import type { AgendaModeKey } from "./config";

export type SuperAgendaTone =
  | "critical"
  | "focus"
  | "deadline"
  | "waiting"
  | "done"
  | "steady"
  | "muted";

export type AgendaCardView = OrgizeAgendaViewCardDto & {
  record: OrgizeViewIndexRecordDto | null;
  signals: string[];
  pressure: SuperAgendaTone;
  aiState: string;
  memorySignals: string[];
};

export type SuperAgendaGroup = {
  id: string;
  title: string;
  subtitle: string;
  selector: string;
  tone: SuperAgendaTone;
  cards: AgendaCardView[];
};

export type SuperAgendaMetric = {
  label: string;
  value: string;
  detail: string;
  tone: SuperAgendaTone;
};

export type SuperAgendaSelectorRule = {
  id: string;
  label: string;
  selector: string;
  description: string;
  count: number;
  tone: SuperAgendaTone;
};

export type SuperAgendaAiBrief = {
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
  modeLabel: string;
  modeDescription: string;
  rangeLabel: string;
  totalCandidates: number;
  visibleCount: number;
  skippedCount: number;
  limit: number | null;
  insights: string[];
  metrics: SuperAgendaMetric[];
  selectorRules: SuperAgendaSelectorRule[];
  aiBrief: SuperAgendaAiBrief;
  sortSteps: SuperAgendaSortStep[];
  groups: SuperAgendaGroup[];
  skipped: OrgizeAgendaViewSkipDto[];
};
