import type {
  OrgizeAgentMemoryCardDto,
  OrgizeMemoryRecordDto,
  OrgizeMemoryRecordStateDto,
  OrgizeMemoryResponseDto,
  OrgizeSourceRangeDto,
} from "orgize/dto";

export type AgentMemoryView = {
  response: OrgizeMemoryResponseDto;
  groups: MemoryStateGroup[];
  topEvidence: MemoryFacetView[];
  topAuthority: MemoryFacetView[];
};

export type MemoryStateGroup = {
  state: OrgizeMemoryRecordStateDto;
  label: string;
  summary: string;
  records: OrgizeMemoryRecordDto[];
  cards: OrgizeAgentMemoryCardDto[];
};

export type MemoryFacetView = {
  code: string;
  label: string;
  count: number;
  weight: number;
};

type MemoryStateMeta = {
  label: string;
  summary: string;
};

const MEMORY_STATE_ORDER: OrgizeMemoryRecordStateDto[] = [
  "current",
  "background",
  "closed",
  "archived",
];

const MEMORY_STATE_META: Record<OrgizeMemoryRecordStateDto, MemoryStateMeta> = {
  current: {
    label: "Current",
    summary: "Active TODO, schedule, deadline, or planning evidence.",
  },
  background: {
    label: "Background",
    summary: "Stable context without active task lifecycle.",
  },
  closed: {
    label: "Closed",
    summary: "DONE/CLOSED evidence retained as historical memory.",
  },
  archived: {
    label: "Archived",
    summary: "Archive metadata preserved but suppressed for active decisions.",
  },
};

export const createAgentMemoryView = (response: OrgizeMemoryResponseDto): AgentMemoryView => ({
  response,
  groups: MEMORY_STATE_ORDER.map((state) => memoryGroup(response, state)),
  topEvidence: facetViews(response.evidenceKinds),
  topAuthority: facetViews(response.authorityKinds),
});

export const memoryStateLabel = (state: OrgizeMemoryRecordStateDto): string =>
  MEMORY_STATE_META[state].label;

export const memorySourceLabel = (source: OrgizeSourceRangeDto): string =>
  `L${source.start.line}:${source.start.column}`;

export const memoryAnchorId = (source: OrgizeSourceRangeDto): string =>
  `memory-record-${source.rangeStart}`;

const memoryGroup = (
  response: OrgizeMemoryResponseDto,
  state: OrgizeMemoryRecordStateDto,
): MemoryStateGroup => ({
  state,
  label: MEMORY_STATE_META[state].label,
  summary: MEMORY_STATE_META[state].summary,
  records: response.records.filter((record) => record.state === state),
  cards: response.cards.filter((card) => card.decision.kind === state),
});

const facetViews = (
  facets: { code: string; label: string; count: number }[],
): MemoryFacetView[] => {
  const peak = Math.max(1, ...facets.map((facet) => facet.count));
  return [...facets]
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label))
    .slice(0, 10)
    .map((facet) => ({
      ...facet,
      weight: facet.count / peak,
    }));
};
