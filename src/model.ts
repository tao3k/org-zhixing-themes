import type {
  OrgizeAgendaViewCardDto,
  OrgizeAgendaViewResponseDto,
  OrgizeAgendaViewSkipDto,
  OrgizeLintFindingDto,
  OrgizeViewIndexRecordDto,
} from "orgize/dto";
import type { AgendaModeKey, AgendaSettings } from "./config";

export type ViewKey = "blog" | "records" | "agenda" | "diagnostics";

export type OrgizeDocumentView = {
  sectionIndex: OrgizeViewIndexRecordDto[];
  recordsByTag: ReadonlyMap<string, OrgizeViewIndexRecordDto[]>;
  recordsByRangeStart: ReadonlyMap<number, OrgizeViewIndexRecordDto>;
  agenda: AgendaItem[];
  agendaView: OrgizeAgendaViewResponseDto | null;
  agendaRange: AgendaSettings | null;
  counts: {
    blog: number;
    records: number;
    agenda: number;
  };
  lint: OrgizeLintFindingDto[] | null;
};

export type AgendaItem = {
  kind: "scheduled" | "deadline" | "closed";
  title: string;
  tags: string[];
  value: string;
  rangeStart: number;
};

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
};

export type SuperAgendaGroup = {
  id: string;
  title: string;
  subtitle: string;
  tone: SuperAgendaTone;
  cards: AgendaCardView[];
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
  groups: SuperAgendaGroup[];
  skipped: OrgizeAgendaViewSkipDto[];
};

export const createDocumentView = (
  sectionIndex: OrgizeViewIndexRecordDto[],
  lint: OrgizeLintFindingDto[] | null = null,
): OrgizeDocumentView => {
  const recordsByTag = indexRecordsByTag(sectionIndex);
  const recordsByRangeStart = indexRecordsByRangeStart(sectionIndex);
  const agenda = indexAgendaItems(sectionIndex);
  return {
    sectionIndex,
    recordsByTag,
    recordsByRangeStart,
    agenda,
    agendaView: null,
    agendaRange: null,
    counts: {
      blog: recordsByTag.get("blog")?.length ?? 0,
      records: recordsByTag.get("record")?.length ?? 0,
      agenda: agenda.length,
    },
    lint,
  };
};

export const withAgendaView = (
  document: OrgizeDocumentView,
  agendaView: OrgizeAgendaViewResponseDto,
  agendaRange: AgendaSettings,
): OrgizeDocumentView => ({
  ...document,
  agendaView,
  agendaRange,
  counts: {
    ...document.counts,
    agenda: agendaView.cards.length,
  },
});

export const withLint = (
  document: OrgizeDocumentView,
  lint: OrgizeLintFindingDto[],
): OrgizeDocumentView => ({
  ...document,
  lint,
});

export const taggedRecords = (
  document: OrgizeDocumentView | null,
  tag: string,
): OrgizeViewIndexRecordDto[] => document?.recordsByTag.get(normalizeTag(tag)) ?? [];

export const agendaItems = (document: OrgizeDocumentView | null): AgendaItem[] =>
  document?.agenda ?? [];

export const superAgendaWorkspace = (
  document: OrgizeDocumentView | null,
  mode: AgendaModeKey,
): SuperAgendaWorkspace | null => {
  if (!document?.agendaView || !document.agendaRange) {
    return null;
  }

  const cards = document.agendaView.cards.map((card) =>
    agendaCardView(card, document.recordsByRangeStart),
  );
  const groups = groupAgendaCards(cards, mode).filter((group) => group.cards.length > 0);
  const blockedCount = cards.filter((card) => card.blockers.length > 0).length;
  const timedCount = cards.filter((card) => Boolean(card.time)).length;
  const deadlineCount = cards.filter((card) => card.kind === "deadline").length;
  const modeDefinition = agendaModeDefinitions[mode];

  return {
    mode,
    modeLabel: modeDefinition.label,
    modeDescription: modeDefinition.description,
    rangeLabel: document.agendaRange.label,
    totalCandidates: document.agendaView.totalCandidates,
    visibleCount: cards.length,
    skippedCount: document.agendaView.skipped.length,
    limit: document.agendaView.limit ?? null,
    insights: [
      `${cards.length} visible`,
      `${deadlineCount} deadlines`,
      `${timedCount} timed`,
      `${blockedCount} blocked`,
      document.agendaView.skipped.length > 0
        ? `${document.agendaView.skipped.length} skipped by limit`
        : "no hidden candidates",
    ],
    groups,
    skipped: document.agendaView.skipped,
  };
};

const indexRecordsByTag = (
  records: OrgizeViewIndexRecordDto[],
): Map<string, OrgizeViewIndexRecordDto[]> => {
  const recordsByTag = new Map<string, OrgizeViewIndexRecordDto[]>();
  for (const record of records) {
    for (const tag of record.effectiveTags) {
      const key = normalizeTag(tag);
      const tagged = recordsByTag.get(key);
      if (tagged) {
        tagged.push(record);
      } else {
        recordsByTag.set(key, [record]);
      }
    }
  }
  return recordsByTag;
};

const indexRecordsByRangeStart = (
  records: OrgizeViewIndexRecordDto[],
): Map<number, OrgizeViewIndexRecordDto> => {
  const recordsByRangeStart = new Map<number, OrgizeViewIndexRecordDto>();
  for (const record of records) {
    recordsByRangeStart.set(record.rangeStart, record);
  }
  return recordsByRangeStart;
};

const indexAgendaItems = (records: OrgizeViewIndexRecordDto[]): AgendaItem[] => {
  const items: AgendaItem[] = [];
  for (const record of records) {
    addPlanning(items, record, "scheduled");
    addPlanning(items, record, "deadline");
    addPlanning(items, record, "closed");
  }
  return items.sort((left, right) => left.rangeStart - right.rangeStart);
};

const normalizeTag = (tag: string): string => tag.toLowerCase();

const addPlanning = (
  items: AgendaItem[],
  record: OrgizeViewIndexRecordDto,
  kind: AgendaItem["kind"],
) => {
  const raw = record.planning[kind];
  if (!raw) {
    return;
  }
  items.push({
    kind,
    title: record.title,
    tags: record.effectiveTags,
    value: raw,
    rangeStart: record.rangeStart,
  });
};

type AgendaGroupSpec = Omit<SuperAgendaGroup, "cards"> & {
  match: (card: AgendaCardView) => boolean;
};

type AgendaModeDefinition = {
  label: string;
  description: string;
};

export const agendaModeDefinitions: Record<AgendaModeKey, AgendaModeDefinition> = {
  focus: {
    label: "Focus",
    description: "Prioritize the next concrete execution surfaces.",
  },
  pressure: {
    label: "Pressure",
    description: "Surface deadline, blocker, and waiting risk first.",
  },
  flow: {
    label: "Flow",
    description: "Read the week as a dated operational stream.",
  },
};

const agendaCardView = (
  card: OrgizeAgendaViewCardDto,
  recordsByRangeStart: ReadonlyMap<number, OrgizeViewIndexRecordDto>,
): AgendaCardView => {
  const record = recordsByRangeStart.get(card.source.rangeStart) ?? null;
  return {
    ...card,
    record,
    signals: agendaSignals(card, record),
    pressure: agendaPressure(card),
  };
};

const groupAgendaCards = (cards: AgendaCardView[], mode: AgendaModeKey): SuperAgendaGroup[] => {
  if (mode === "flow") {
    return groupAgendaCardsByDate(cards);
  }
  const remaining = new Set(cards);
  return agendaGroupSpecsFor(mode).map((spec) => {
    const grouped: AgendaCardView[] = [];
    for (const card of cards) {
      if (remaining.has(card) && spec.match(card)) {
        grouped.push(card);
        remaining.delete(card);
      }
    }
    return {
      id: spec.id,
      title: spec.title,
      subtitle: spec.subtitle,
      tone: spec.tone,
      cards: grouped,
    };
  });
};

const agendaGroupSpecsFor = (mode: Exclude<AgendaModeKey, "flow">): AgendaGroupSpec[] => {
  const specs = {
    focus: [
      blockedGroupSpec(),
      timedGroupSpec(),
      deadlineGroupSpec(),
      waitingGroupSpec(),
      doneGroupSpec(),
      scheduledGroupSpec(),
      otherGroupSpec(),
    ],
    pressure: [
      deadlineGroupSpec(),
      blockedGroupSpec(),
      waitingGroupSpec(),
      timedGroupSpec(),
      scheduledGroupSpec(),
      doneGroupSpec(),
      otherGroupSpec(),
    ],
  } satisfies Record<Exclude<AgendaModeKey, "flow">, AgendaGroupSpec[]>;
  return specs[mode];
};

const groupAgendaCardsByDate = (cards: AgendaCardView[]): SuperAgendaGroup[] => {
  const groups = new Map<string, AgendaCardView[]>();
  for (const card of cards) {
    const grouped = groups.get(card.displayDate);
    if (grouped) {
      grouped.push(card);
    } else {
      groups.set(card.displayDate, [card]);
    }
  }
  return [...groups.entries()].map(([date, groupCards]) => ({
    id: `date-${date}`,
    title: date,
    subtitle: flowSubtitle(groupCards),
    tone: dominantTone(groupCards),
    cards: groupCards,
  }));
};

const flowSubtitle = (cards: AgendaCardView[]): string => {
  const timed = cards.filter((card) => card.time).length;
  const deadlines = cards.filter((card) => card.kind === "deadline").length;
  const blockers = cards.filter((card) => card.blockers.length > 0).length;
  return [
    `${cards.length} rows`,
    timed > 0 ? `${timed} timed` : null,
    deadlines > 0 ? `${deadlines} deadline` : null,
    blockers > 0 ? `${blockers} blocked` : null,
  ]
    .filter(Boolean)
    .join(" / ");
};

const dominantTone = (cards: AgendaCardView[]): SuperAgendaTone => {
  const tones: SuperAgendaTone[] = ["critical", "deadline", "focus", "waiting", "done"];
  return tones.find((tone) => cards.some((card) => card.pressure === tone)) ?? "steady";
};

const blockedGroupSpec = (): AgendaGroupSpec => ({
  id: "blocked",
  title: "Blocked Flow",
  subtitle: "Parser-owned ORDERED edges or dependency receipts need attention.",
  tone: "critical",
  match: (card) => card.blockers.length > 0,
});

const timedGroupSpec = (): AgendaGroupSpec => ({
  id: "focus",
  title: "Timed Focus",
  subtitle: "Items with concrete time windows that shape the day.",
  tone: "focus",
  match: (card) => Boolean(card.time),
});

const deadlineGroupSpec = (): AgendaGroupSpec => ({
  id: "deadline",
  title: "Deadline Pressure",
  subtitle: "Deadline rows and due-date warnings from the agenda projection.",
  tone: "deadline",
  match: (card) => card.kind === "deadline",
});

const waitingGroupSpec = (): AgendaGroupSpec => ({
  id: "waiting",
  title: "Waiting State",
  subtitle: "Work that is visible, but intentionally parked.",
  tone: "waiting",
  match: (card) => card.todo === "WAIT" || card.todo === "WAITING",
});

const doneGroupSpec = (): AgendaGroupSpec => ({
  id: "done",
  title: "Completed Signal",
  subtitle: "Closed or done rows kept visible for recent operational context.",
  tone: "done",
  match: (card) => card.kind === "closed" || card.todoState === "done",
});

const scheduledGroupSpec = (): AgendaGroupSpec => ({
  id: "scheduled",
  title: "Scheduled Flow",
  subtitle: "Planned work without a tighter attention signal.",
  tone: "steady",
  match: (card) => card.kind === "scheduled",
});

const otherGroupSpec = (): AgendaGroupSpec => ({
  id: "other",
  title: "Other Candidates",
  subtitle: "Remaining parser-visible rows, preserved instead of dropped.",
  tone: "muted",
  match: () => true,
});

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
      .filter((property) => ["AREA", "EFFORT", "KIND", "ID"].includes(property.key))
      .map((property) => `${property.key}: ${property.value}`),
  ];
  return signals.filter((signal): signal is string => Boolean(signal));
};

const agendaPressure = (card: OrgizeAgendaViewCardDto): SuperAgendaTone => {
  if (card.blockers.length > 0) {
    return "critical";
  }
  if (card.kind === "deadline") {
    return "deadline";
  }
  if (card.time) {
    return "focus";
  }
  if (card.kind === "closed" || card.todoState === "done") {
    return "done";
  }
  return "steady";
};
