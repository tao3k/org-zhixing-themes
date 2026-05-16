import type {
  AgendaCardView,
  SuperAgendaGroup,
  SuperAgendaProgram,
  SuperAgendaProgramRule,
  SuperAgendaSelector,
  SuperAgendaTone,
  SuperAgendaTraceStep,
} from "./agendaTypes";
import { selectorToSexp } from "./agendaPrograms";

export type ProgramExecution = {
  groups: SuperAgendaGroup[];
  trace: SuperAgendaTraceStep[];
  discardedCount: number;
  unmatchedCount: number;
  consumedCount: number;
};

export const executeProgram = (
  cards: AgendaCardView[],
  program: SuperAgendaProgram,
): ProgramExecution => runProgram(cards, program);

const runProgram = (cards: AgendaCardView[], program: SuperAgendaProgram): ProgramExecution => {
  let remaining = [...cards];
  const groups: SuperAgendaGroup[] = [];
  const trace: SuperAgendaTraceStep[] = [];
  let discardedCount = 0;
  let consumedCount = 0;

  for (const programRule of program.rules) {
    const activeSelector = programRule.selector;
    const beforeCount = remaining.length;
    const selectorText = selectorToSexp(activeSelector);

    if (activeSelector.kind === "discard") {
      const matched = remaining.filter((card) => matchesSelector(card, activeSelector.selector));
      const matchedSet = new Set(matched);
      remaining = remaining.filter((card) => !matchedSet.has(card));
      discardedCount += matched.length;
      consumedCount += matched.length;
      trace.push(
        traceStep(programRule, selectorText, "discard", {
          beforeCount,
          matchedCount: matched.length,
          emittedCount: 0,
          consumedCount: matched.length,
          discardedCount: matched.length,
          remainingAfter: remaining.length,
          outputTitles: [],
          note:
            matched.length > 0
              ? "Matched rows are consumed without creating a section."
              : "No rows matched; downstream input is unchanged.",
        }),
      );
      continue;
    }

    if (activeSelector.kind === "take") {
      const matched = remaining.filter((card) => matchesSelector(card, activeSelector.selector));
      const picked = matched.slice(0, activeSelector.count);
      const matchedSet = new Set(matched);
      remaining = remaining.filter((card) => !matchedSet.has(card));
      const hidden = Math.max(0, matched.length - picked.length);
      discardedCount += hidden;
      consumedCount += matched.length;
      if (picked.length > 0) {
        groups.push(groupFromRule(programRule, picked, null));
      }
      trace.push(
        traceStep(programRule, selectorText, "take", {
          beforeCount,
          matchedCount: matched.length,
          emittedCount: picked.length,
          consumedCount: matched.length,
          discardedCount: hidden,
          remainingAfter: remaining.length,
          outputTitles: picked.map((card) => card.title),
          note:
            matched.length > 0
              ? `First ${activeSelector.count} matches are emitted; later matches are hidden from downstream rules.`
              : "No rows matched the bounded selector.",
        }),
      );
      continue;
    }

    if (activeSelector.kind === "auto") {
      const buckets = new Map<string, AgendaCardView[]>();
      const matched: AgendaCardView[] = [];
      for (const card of remaining) {
        const key = autoGroupKey(card, activeSelector);
        if (!key) {
          continue;
        }
        matched.push(card);
        buckets.set(key, [...(buckets.get(key) ?? []), card]);
      }
      const matchedSet = new Set(matched);
      remaining = remaining.filter((card) => !matchedSet.has(card));
      consumedCount += matched.length;
      const autoGroups = [...buckets.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, bucket]) => groupFromRule(programRule, bucket, key));
      groups.push(...autoGroups);
      trace.push(
        traceStep(programRule, selectorText, "auto", {
          beforeCount,
          matchedCount: matched.length,
          emittedCount: matched.length,
          consumedCount: matched.length,
          discardedCount: 0,
          remainingAfter: remaining.length,
          outputTitles: autoGroups.map((group) => group.title),
          note:
            autoGroups.length > 0
              ? `${autoGroups.length} generated section${autoGroups.length === 1 ? "" : "s"} from parser metadata.`
              : "No parser metadata buckets were generated.",
        }),
      );
      continue;
    }

    const matched = remaining.filter((card) => matchesSelector(card, activeSelector));
    const matchedSet = new Set(matched);
    remaining = remaining.filter((card) => !matchedSet.has(card));
    consumedCount += matched.length;
    if (matched.length > 0) {
      groups.push(groupFromRule(programRule, matched, null));
    }
    trace.push(
      traceStep(programRule, selectorText, "group", {
        beforeCount,
        matchedCount: matched.length,
        emittedCount: matched.length,
        consumedCount: matched.length,
        discardedCount: 0,
        remainingAfter: remaining.length,
        outputTitles: matched.length > 0 ? [programRule.title] : [],
        note:
          matched.length > 0
            ? "Matched rows become a visible section and are removed from downstream selectors."
            : "No rows matched; downstream input is unchanged.",
      }),
    );
  }

  if (remaining.length > 0) {
    groups.push({
      id: "unmatched",
      ruleId: "unmatched",
      title: "Other items",
      subtitle: "Rows that did not match any configured group, displayed at order 99.",
      selector: ":anything",
      order: 99,
      tone: "muted",
      autoKey: null,
      cards: remaining,
    });
  }

  return {
    groups: groups
      .filter((group) => group.cards.length > 0)
      .sort((left, right) => left.order - right.order || left.title.localeCompare(right.title)),
    trace,
    discardedCount,
    unmatchedCount: remaining.length,
    consumedCount,
  };
};

const traceStep = (
  programRule: SuperAgendaProgramRule,
  selectorText: string,
  operation: SuperAgendaTraceStep["operation"],
  stats: Omit<
    SuperAgendaTraceStep,
    "inputCount" | "operation" | "order" | "ruleId" | "selector" | "title" | "tone"
  > & { beforeCount: number },
): SuperAgendaTraceStep => ({
  ruleId: programRule.id,
  title: programRule.title,
  selector: selectorText,
  order: programRule.order,
  tone: programRule.tone,
  operation,
  matchedCount: stats.matchedCount,
  emittedCount: stats.emittedCount,
  consumedCount: stats.consumedCount,
  discardedCount: stats.discardedCount,
  inputCount: stats.beforeCount,
  remainingAfter: stats.remainingAfter,
  outputTitles: stats.outputTitles,
  note: `${stats.note} ${stats.beforeCount} in -> ${stats.remainingAfter} remain.`,
});

const groupFromRule = (
  programRule: SuperAgendaProgramRule,
  cards: AgendaCardView[],
  autoKey: string | null,
): SuperAgendaGroup => ({
  id: autoKey ? `${programRule.id}-${slugify(autoKey)}` : programRule.id,
  ruleId: programRule.id,
  title: autoKey ? `${programRule.title}: ${autoKey}` : programRule.title,
  subtitle: groupSubtitle(cards, programRule, autoKey),
  selector: selectorToSexp(programRule.selector),
  order: programRule.order,
  tone: dominantTone(cards, programRule.tone),
  autoKey,
  face: programRule.face,
  transformer: programRule.transformer,
  cards,
});

const groupSubtitle = (
  cards: AgendaCardView[],
  programRule: SuperAgendaProgramRule,
  autoKey: string | null,
): string => {
  const timed = cards.filter((card) => card.time).length;
  const deadlines = cards.filter((card) => card.kind === "deadline").length;
  const blockers = cards.filter((card) => card.blockers.length > 0).length;
  return [
    `${cards.length} consumed`,
    autoKey ? `auto key ${autoKey}` : programRule.subtitle,
    timed > 0 ? `${timed} timed` : null,
    deadlines > 0 ? `${deadlines} deadline` : null,
    blockers > 0 ? `${blockers} blocked` : null,
  ]
    .filter(Boolean)
    .join(" / ");
};

const matchesSelector = (card: AgendaCardView, item: SuperAgendaSelector): boolean => {
  switch (item.kind) {
    case "anything":
      return true;
    case "blocked":
      return card.blockers.length > 0;
    case "category":
      return includesValue(item.values, card.category);
    case "closed":
      return card.kind === "closed";
    case "deadline":
      return card.kind === "deadline";
    case "done":
      return card.kind === "closed" || card.todoState === "done";
    case "memory":
      return card.memorySignals.length > 0 || card.receipts.length > 0;
    case "effort":
      return compareEffort(card, item.operator, item.value);
    case "priority":
      return comparePriority(card, item.operator, item.value);
    case "property":
      return matchesProperty(card, item.key, item.values);
    case "scheduled":
      return card.kind === "scheduled";
    case "tag":
      return item.values.some((value) =>
        card.effectiveTags.some((tag) => normalizeToken(tag) === normalizeToken(value)),
      );
    case "time-grid":
      return Boolean(card.time);
    case "todo":
      return includesValue(item.values, card.todo);
    case "and":
      return item.selectors.every((inner) => matchesSelector(card, inner));
    case "not":
      return !matchesSelector(card, item.selector);
    case "or":
      return item.selectors.some((inner) => matchesSelector(card, inner));
    case "take":
    case "discard":
      return matchesSelector(card, item.selector);
    case "auto":
      return Boolean(autoGroupKey(card, item));
  }
};

const matchesProperty = (
  card: AgendaCardView,
  key: string,
  values: string[] | undefined,
): boolean => {
  const value = recordProperty(card, key);
  if (!value) {
    return false;
  }
  return !values || values.length === 0 ? true : includesValue(values, value);
};

const compareEffort = (card: AgendaCardView, operator: "<=" | ">=", threshold: string): boolean => {
  const minutes = effortMinutes(card);
  const thresholdMinutes = parseEffortMinutes(threshold);
  return minutes === null || thresholdMinutes === null
    ? false
    : compareNumber(minutes, operator, thresholdMinutes);
};

const comparePriority = (
  card: AgendaCardView,
  operator: "<=" | "=" | ">=",
  threshold: string,
): boolean => {
  const cardRank = priorityRank(priorityToken(card));
  const thresholdRank = priorityRank(priorityTokenFromString(threshold));
  return cardRank === null || thresholdRank === null
    ? false
    : compareNumber(cardRank, operator, thresholdRank);
};

const autoGroupKey = (
  card: AgendaCardView,
  item: Extract<SuperAgendaSelector, { kind: "auto" }>,
): string | null => {
  switch (item.by) {
    case "category":
      return card.category ?? null;
    case "planning":
      return card.displayDate || null;
    case "priority":
      return priorityToken(card);
    case "property":
      return item.property ? recordProperty(card, item.property) : null;
    case "tags":
      return card.effectiveTags.length > 0
        ? card.effectiveTags
            .map((tag) => `#${tag}`)
            .sort()
            .join(" ")
        : null;
    case "todo":
      return card.todo ?? null;
  }
};

const dominantTone = (cards: AgendaCardView[], fallback: SuperAgendaTone): SuperAgendaTone => {
  const tones: SuperAgendaTone[] = ["critical", "deadline", "focus", "waiting", "done"];
  return tones.find((tone) => cards.some((card) => card.pressure === tone)) ?? fallback;
};

const recordProperty = (card: AgendaCardView, key: string): string | null =>
  card.record?.properties.find((property) => property.key === key)?.value ?? null;

const sortKeyValue = (card: AgendaCardView, key: string): string | null =>
  card.sortKeys.find((sortKey) => sortKey.key === key)?.value ?? null;

const effortMinutes = (card: AgendaCardView): number | null =>
  parseEffortMinutes(recordProperty(card, "EFFORT"));

const parseEffortMinutes = (value: string | null | undefined): number | null => {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  const clock = normalized.match(/^(\d+):(\d{1,2})$/);
  if (clock) {
    return Number(clock[1]) * 60 + Number(clock[2]);
  }
  const unit = normalized.match(
    /^(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours|m|min|mins|minute|minutes)$/,
  );
  if (unit) {
    const amount = Number(unit[1]);
    return unit[2].startsWith("h") ? amount * 60 : amount;
  }
  const numberOnly = normalized.match(/^\d+(?:\.\d+)?$/);
  return numberOnly ? Number(normalized) : null;
};

const priorityToken = (card: AgendaCardView): string | null =>
  priorityTokenFromString(sortKeyValue(card, "priority")) ?? priorityTokenFromString(card.title);

const priorityTokenFromString = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const normalized = value.trim();
  const cookie = normalized.match(/\[#([A-Z])\]/i);
  if (cookie) return cookie[1].toUpperCase();
  const alpha = normalized.match(/(?:^|\b)([A-Z])(?:\b|$)/i);
  if (alpha) return alpha[1].toUpperCase();
  const numeric = Number(normalized);
  if (Number.isInteger(numeric) && numeric >= 65 && numeric <= 90) {
    return String.fromCharCode(numeric);
  }
  return null;
};

const priorityRank = (token: string | null): number | null =>
  token && /^[A-Z]$/.test(token) ? token.charCodeAt(0) - 64 : null;

const compareNumber = (left: number, operator: "<=" | "=" | ">=", right: number): boolean => {
  switch (operator) {
    case "<=":
      return left <= right;
    case "=":
      return left === right;
    case ">=":
      return left >= right;
  }
};

const includesValue = (values: string[], candidate: string | null | undefined): boolean =>
  Boolean(candidate) &&
  values.some((value) => normalizeToken(value) === normalizeToken(candidate ?? ""));

const normalizeToken = (value: string): string => value.trim().toLowerCase();

const slugify = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
