import type {
  OrgizeAgendaViewCardDto,
  OrgizeAgendaViewResponseDto,
  OrgizeViewIndexRecordDto,
} from "orgize/dto";
import type { AgendaModeKey } from "./config";
import type {
  AgendaCardView,
  AgendaPlanningEntry,
  SuperAgendaAgentBrief,
  SuperAgendaCapabilitySummary,
  SuperAgendaCaptureEntry,
  SuperAgendaMetric,
  SuperAgendaSelectorCapability,
  SuperAgendaSortStep,
  SuperAgendaTone,
  SuperAgendaWorkspace,
} from "./agendaTypes";
import { executeProgram, type ProgramExecution } from "./agendaEngine";
import { agendaModeDefinitions, agendaPrograms, selectorCapabilityViews } from "./agendaPrograms";
import type { OrgizeDocumentView } from "./model";

export { agendaModeDefinitions, agendaPrograms };

export const superAgendaWorkspace = (
  document: OrgizeDocumentView | null,
  mode: AgendaModeKey,
): SuperAgendaWorkspace | null => {
  if (!document?.agendaView || !document.agendaRange) {
    return null;
  }

  const program = agendaPrograms[mode] ?? agendaPrograms.classic;
  const cards = document.agendaView.cards.map((card) =>
    agendaCardView(card, document.recordsByRangeStart),
  );
  const execution = executeProgram(cards, program);
  const blockedCount = cards.filter((card) => card.blockers.length > 0).length;
  const timedCount = cards.filter((card) => Boolean(card.time)).length;
  const deadlineCount = cards.filter((card) => card.kind === "deadline").length;
  const receiptCount = cards.reduce((sum, card) => sum + card.receipts.length, 0);
  const memoryCount = cards.filter((card) => card.memorySignals.length > 0).length;
  const propertyCount = cards.reduce((sum, card) => sum + (card.record?.properties.length ?? 0), 0);
  const capabilities = selectorCapabilityViews(program);
  const capabilitySummary = summarizeCapabilities(capabilities);

  return {
    mode,
    program,
    rangeLabel: document.agendaRange.label,
    totalCandidates: document.agendaView.totalCandidates,
    visibleCount: cards.length,
    skippedCount: document.agendaView.skipped.length,
    limit: document.agendaView.limit ?? null,
    consumedCount: execution.consumedCount,
    discardedCount: execution.discardedCount,
    unmatchedCount: execution.unmatchedCount,
    insights: agendaInsights(
      cards,
      deadlineCount,
      timedCount,
      blockedCount,
      receiptCount,
      execution,
      document,
    ),
    metrics: agendaMetrics(
      cards,
      execution,
      capabilitySummary,
      blockedCount,
      deadlineCount,
      receiptCount,
      propertyCount,
      memoryCount,
      document,
    ),
    capabilitySummary,
    selectorCapabilities: capabilities,
    trace: execution.trace,
    agentBrief: agendaAgentBrief(cards, execution.groups, {
      blockedCount,
      deadlineCount,
      timedCount,
      receiptCount,
      memoryCount,
    }),
    sortSteps: effectiveSortSteps(document.agendaView),
    groups: execution.groups,
    skipped: document.agendaView.skipped,
  };
};

const agendaInsights = (
  cards: AgendaCardView[],
  deadlineCount: number,
  timedCount: number,
  blockedCount: number,
  receiptCount: number,
  execution: ProgramExecution,
  document: OrgizeDocumentView,
): string[] => [
  `${cards.length} visible`,
  `${execution.consumedCount} consumed`,
  `${execution.discardedCount} discarded`,
  `${execution.unmatchedCount} unmatched`,
  `${deadlineCount} deadlines`,
  `${timedCount} timed`,
  `${blockedCount} blocked`,
  `${receiptCount} receipts`,
  document.agendaView?.skipped.length
    ? `${document.agendaView.skipped.length} skipped by limit`
    : "no limit skips",
];

const agendaMetrics = (
  cards: AgendaCardView[],
  execution: ProgramExecution,
  capabilitySummary: SuperAgendaCapabilitySummary,
  blockedCount: number,
  deadlineCount: number,
  receiptCount: number,
  propertyCount: number,
  memoryCount: number,
  document: OrgizeDocumentView,
): SuperAgendaMetric[] => [
  {
    label: "Input rows",
    value: String(cards.length),
    detail: `${document.agendaView?.totalCandidates ?? cards.length} parsed candidates`,
    tone: "steady",
  },
  {
    label: "Sections",
    value: String(execution.groups.length),
    detail: `${execution.consumedCount} consumed / ${execution.unmatchedCount} unmatched`,
    tone: "focus",
  },
  {
    label: "Risk edges",
    value: String(blockedCount + deadlineCount),
    detail: `${blockedCount} blocked / ${deadlineCount} deadline`,
    tone: blockedCount > 0 ? "critical" : deadlineCount > 0 ? "deadline" : "steady",
  },
  {
    label: "Selectors",
    value: `${capabilitySummary.implemented}/${capabilitySummary.total}`,
    detail: `${capabilitySummary.active} active / ${capabilitySummary.planned} planned`,
    tone: "steady",
  },
  {
    label: "Agent context",
    value: String(receiptCount + propertyCount + memoryCount),
    detail: `${receiptCount} receipts / ${propertyCount} properties / ${memoryCount} memory`,
    tone: "waiting",
  },
];

const summarizeCapabilities = (
  capabilities: SuperAgendaSelectorCapability[],
): SuperAgendaCapabilitySummary => ({
  total: capabilities.length,
  implemented: capabilities.filter((capability) => capability.status !== "planned").length,
  active: capabilities.filter((capability) => capability.active).length,
  planned: capabilities.filter((capability) => capability.status === "planned").length,
});

const agendaCardView = (
  card: OrgizeAgendaViewCardDto,
  recordsByRangeStart: ReadonlyMap<number, OrgizeViewIndexRecordDto>,
): AgendaCardView => {
  const record = recordsByRangeStart.get(card.source.rangeStart) ?? null;
  const displayCard = {
    ...card,
    title: orgTitleText(card.title),
    blockers: card.blockers.map((blocker) => ({
      ...blocker,
      blocker: {
        ...blocker.blocker,
        title: orgTitleText(blocker.blocker.title),
      },
    })),
  };
  return {
    ...displayCard,
    record,
    signals: agendaSignals(displayCard, record),
    planning: agendaPlanningEntries(record),
    pressure: agendaPressure(displayCard),
    agentState: agendaAgentState(displayCard, record),
    memorySignals: agendaMemorySignals(displayCard, record),
  };
};

const agendaPlanningEntries = (record: OrgizeViewIndexRecordDto | null): AgendaPlanningEntry[] =>
  [
    planningEntry("SCHEDULED", "scheduled", record?.planning.scheduled),
    planningEntry("DEADLINE", "deadline", record?.planning.deadline),
    planningEntry("CLOSED", "closed", record?.planning.closed),
  ].filter((entry): entry is AgendaPlanningEntry => entry !== null);

const planningEntry = (
  label: AgendaPlanningEntry["label"],
  kind: AgendaPlanningEntry["kind"],
  value: unknown,
): AgendaPlanningEntry | null => {
  const raw =
    typeof value === "string"
      ? value
      : value && typeof value === "object" && "raw" in value && typeof value.raw === "string"
        ? value.raw
        : "";
  return raw ? { label, kind, value: raw } : null;
};

const agendaSignals = (
  card: OrgizeAgendaViewCardDto,
  record: OrgizeViewIndexRecordDto | null,
): string[] => {
  const signals = [
    card.todo,
    card.category,
    card.time ? `${card.time}${card.endTime ? `-${card.endTime}` : ""}` : null,
    ...card.effectiveTags.map((tag) => `#${tag}`),
    ...(record?.properties ?? [])
      .filter((property) => ["AREA", "EFFORT", "KIND", "ID", "DIR"].includes(property.key))
      .map((property) => `${property.key}: ${property.value}`),
  ];
  return signals.filter((signal): signal is string => Boolean(signal));
};

const agendaMemorySignals = (
  card: OrgizeAgendaViewCardDto,
  record: OrgizeViewIndexRecordDto | null,
): string[] => {
  const tags = card.effectiveTags.map((tag) => tag.toLowerCase());
  const signals = [
    tags.includes("record") ? "record" : null,
    tags.includes("blog") ? "blog" : null,
    tags.includes("attach") ? "attachment" : null,
    tags.includes("memory") ? "memory" : null,
    record?.properties.some((property) => property.key === "ID") ? "stable ID" : null,
    record?.properties.some((property) => property.key === "KIND") ? "typed record" : null,
    record?.properties.some((property) => property.key === "AREA") ? "area context" : null,
  ];
  return signals.filter((signal): signal is string => Boolean(signal));
};

const agendaPressure = (card: OrgizeAgendaViewCardDto): SuperAgendaTone => {
  if (card.blockers.length > 0) return "critical";
  if (card.kind === "deadline") return "deadline";
  if (card.time) return "focus";
  if (card.kind === "closed" || card.todoState === "done") return "done";
  if (card.todo === "WAIT" || card.todo === "WAITING") return "waiting";
  return "steady";
};

const agendaAgentState = (
  card: OrgizeAgendaViewCardDto,
  record: OrgizeViewIndexRecordDto | null,
): string => {
  if (card.blockers.length > 0) return "unblock brief";
  if (card.kind === "deadline") return "risk brief";
  if (card.time) return "execution brief";
  if (agendaMemorySignals(card, record).length > 0) return "memory context";
  return "agenda context";
};

const agendaAgentBrief = (
  cards: AgendaCardView[],
  groups: SuperAgendaWorkspace["groups"],
  stats: {
    blockedCount: number;
    deadlineCount: number;
    timedCount: number;
    receiptCount: number;
    memoryCount: number;
  },
): SuperAgendaAgentBrief => {
  const firstBlocked = cards.find((card) => card.blockers.length > 0);
  const firstDeadline = cards.find((card) => card.kind === "deadline");
  const firstTimed = cards.find((card) => Boolean(card.time));
  const firstMemory = cards.find((card) => card.memorySignals.length > 0);
  const recommendations = [
    firstBlocked ? `Explain the blocker chain for "${firstBlocked.title}".` : null,
    firstDeadline ? `Generate a deadline-risk note for "${firstDeadline.title}".` : null,
    firstTimed ? `Turn "${firstTimed.title}" into the next execution brief.` : null,
    firstMemory ? `Promote "${firstMemory.title}" into the running agenda record.` : null,
  ].filter((item): item is string => Boolean(item));
  return {
    headline: agendaHeadline(firstBlocked, firstDeadline, firstTimed),
    summary: [
      `${groups.length} visible sections`,
      `${cards.length} agenda rows`,
      `${stats.receiptCount} parser receipts`,
      `${stats.memoryCount} memory-linked rows`,
      `${stats.blockedCount} blockers`,
      `${stats.deadlineCount} deadlines`,
      `${stats.timedCount} timed slots`,
    ].join(" / "),
    recommendations:
      recommendations.length > 0
        ? recommendations
        : ["Summarize the visible agenda into a daily operating note."],
    prompts: [
      "Explain this agenda by selector rule, using receipts and blockers as evidence.",
      "Draft a progress log from DONE, record, and memory rows.",
      "Turn deadline pressure into a concrete next-action queue.",
    ],
    captureLog: agendaCaptureLog(cards),
  };
};

const agendaHeadline = (
  firstBlocked: AgendaCardView | undefined,
  firstDeadline: AgendaCardView | undefined,
  firstTimed: AgendaCardView | undefined,
): string =>
  firstBlocked
    ? `Unblock ${firstBlocked.title}`
    : firstDeadline
      ? `Watch ${firstDeadline.title}`
      : firstTimed
        ? `Start with ${firstTimed.title}`
        : "Agenda context is ready";

const agendaCaptureLog = (cards: AgendaCardView[]): SuperAgendaCaptureEntry[] =>
  cards
    .filter(
      (card) =>
        card.memorySignals.length > 0 || card.receipts.length > 0 || card.blockers.length > 0,
    )
    .slice(0, 8)
    .map((card) => ({
      title: card.title,
      label: card.memorySignals.length > 0 ? card.memorySignals.join(" / ") : card.agentState,
      detail: card.receipts[0]?.message ?? `${card.kind} on ${card.displayDate}`,
      tone: card.pressure,
    }));

const sortStepView = (
  step: OrgizeAgendaViewResponseDto["sortStrategy"][number],
): SuperAgendaSortStep => ({
  label: sortStepLabel(step.key),
  direction: step.direction,
  detail: sortStepDetail(step.key),
});

const effectiveSortSteps = (agendaView: OrgizeAgendaViewResponseDto): SuperAgendaSortStep[] => {
  if (agendaView.sortStrategy.length > 0) {
    return agendaView.sortStrategy.map(sortStepView);
  }
  return (agendaView.cards[0]?.sortKeys ?? []).map((step) => ({
    label: sortStepLabel(step.key),
    direction: "default",
    detail: sortStepDetail(step.key),
  }));
};

const sortStepLabel = (key: string): string => {
  const labels: Record<string, string> = {
    displayDate: "Planning date",
    time: "Time grid",
    kind: "Agenda kind",
    level: "Outline depth",
    title: "Title",
    targetDate: "Target date",
    scheduledDate: "Scheduled date",
    deadlineDate: "Deadline date",
    priority: "Priority",
    category: "Category",
    todoState: "TODO state",
  };
  return labels[key] ?? key;
};

const sortStepDetail = (key: string): string => {
  const details: Record<string, string> = {
    displayDate: "daily and weekly agenda order",
    time: "keeps timed rows close to execution",
    kind: "separates scheduled, deadline, and closed rows",
    level: "preserves outline hierarchy pressure",
    title: "stable alphabetical fallback",
    targetDate: "normalizes timestamp targets",
    scheduledDate: "scheduled timestamp evidence",
    deadlineDate: "deadline timestamp evidence",
    priority: "Org priority signal",
    category: "source category signal",
    todoState: "stateful completion signal",
  };
  return details[key] ?? "parser sort signal";
};

const orgTitleText = (value: string): string =>
  value
    .replace(/\[\[([^\]]+)\]\[([^\]]+)\]\]/g, "$2")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
