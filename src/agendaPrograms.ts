import type { AgendaModeKey } from "./config";
import type {
  SuperAgendaProgram,
  SuperAgendaProgramRule,
  SuperAgendaSelectorCapability,
  SuperAgendaSelector,
} from "./agendaTypes";

type AgendaModeDefinition = {
  label: string;
  description: string;
};

const selector = {
  and: (...selectors: SuperAgendaSelector[]): SuperAgendaSelector => ({ kind: "and", selectors }),
  auto: (
    by: "category" | "planning" | "priority" | "property" | "tags" | "todo",
    property?: string,
  ): SuperAgendaSelector => ({ kind: "auto", by, property }),
  discard: (inner: SuperAgendaSelector): SuperAgendaSelector => ({
    kind: "discard",
    selector: inner,
  }),
  not: (inner: SuperAgendaSelector): SuperAgendaSelector => ({ kind: "not", selector: inner }),
  or: (...selectors: SuperAgendaSelector[]): SuperAgendaSelector => ({ kind: "or", selectors }),
  effort: (operator: "<=" | ">=", value: string): SuperAgendaSelector => ({
    kind: "effort",
    operator,
    value,
  }),
  priority: (operator: "<=" | "=" | ">=", value: string): SuperAgendaSelector => ({
    kind: "priority",
    operator,
    value,
  }),
  property: (key: string, values?: string[]): SuperAgendaSelector => ({
    kind: "property",
    key,
    values,
  }),
  tag: (...values: string[]): SuperAgendaSelector => ({ kind: "tag", values }),
  take: (count: number, inner: SuperAgendaSelector): SuperAgendaSelector => ({
    kind: "take",
    count,
    selector: inner,
  }),
  todo: (...values: string[]): SuperAgendaSelector => ({ kind: "todo", values }),
};

const atomic = {
  anything: { kind: "anything" } as SuperAgendaSelector,
  blocked: { kind: "blocked" } as SuperAgendaSelector,
  closed: { kind: "closed" } as SuperAgendaSelector,
  deadline: { kind: "deadline" } as SuperAgendaSelector,
  done: { kind: "done" } as SuperAgendaSelector,
  memory: { kind: "memory" } as SuperAgendaSelector,
  scheduled: { kind: "scheduled" } as SuperAgendaSelector,
  timeGrid: { kind: "time-grid" } as SuperAgendaSelector,
};

export const agendaPrograms: Record<AgendaModeKey, SuperAgendaProgram> = {
  classic: buildProgram({
    key: "classic",
    label: "Classic Super Agenda",
    shortLabel: "Classic",
    description: "A browser version of the README pattern: today, important, waiting, backlog.",
    intent: "Make the consume order legible while preserving the daily agenda surface.",
    rules: [
      rule({
        id: "today",
        title: "Today",
        subtitle: "Timed rows or explicit TODAY/NEXT execution state.",
        selector: selector.or(atomic.timeGrid, selector.todo("TODAY", "NEXT")),
        order: 0,
        tone: "focus",
        face: "time grid accent",
        transformer: "uppercase-title",
      }),
      rule({
        id: "important",
        title: "Important",
        subtitle: "Deadline pressure, blocker edges, priority A, and focus tags are pulled first.",
        selector: selector.or(
          atomic.deadline,
          atomic.blocked,
          selector.priority("<=", "A"),
          selector.tag("focus", "ops"),
        ),
        order: 0,
        tone: "deadline",
        transformer: "deadline-risk-label",
      }),
      rule({
        id: "context",
        title: "Record / Memory Context",
        subtitle: "Items carrying record, memory, attachment, or ID evidence.",
        selector: selector.or(atomic.memory, selector.tag("record", "memory", "attach")),
        order: 1,
        tone: "steady",
      }),
      rule({
        id: "waiting",
        title: "WAITING items",
        subtitle: "Parked rows stay visible but no longer pollute the execution lane.",
        selector: selector.todo("WAIT", "WAITING"),
        order: 8,
        tone: "waiting",
      }),
      rule({
        id: "someday",
        title: "Closed / Review Tail",
        subtitle: "Recent DONE/CLOSED rows are sorted near the end for review context.",
        selector: selector.or(atomic.done, atomic.closed),
        order: 9,
        tone: "done",
      }),
    ],
  }),
  strict: buildProgram({
    key: "strict",
    label: "Strict Consume Pipeline",
    shortLabel: "Strict",
    description: "Shows discard and take semantics explicitly before emitting final sections.",
    intent:
      "Use org-super-agenda as an explicit narrowing workflow instead of a decorative sorter.",
    rules: [
      rule({
        id: "discard-done",
        title: "Discard completed rows",
        subtitle: "Consumes DONE/CLOSED before the rest of the pipeline sees them.",
        selector: selector.discard(selector.or(atomic.done, atomic.closed)),
        order: -3,
        tone: "done",
      }),
      rule({
        id: "take-pressure",
        title: "Take first 3 pressure rows",
        subtitle: "A bounded working set: deadlines, blockers, and priority A win.",
        selector: selector.take(
          3,
          selector.or(atomic.deadline, atomic.blocked, selector.priority("<=", "A")),
        ),
        order: -2,
        tone: "critical",
      }),
      rule({
        id: "quick-effort",
        title: "Small effort wins",
        subtitle: "Effort-aware rows at or below one hour become quick execution candidates.",
        selector: selector.effort("<=", "1h"),
        order: -1,
        tone: "focus",
      }),
      rule({
        id: "ordered-front",
        title: "ORDERED project front",
        subtitle: "Parser-owned blocker edges expose the first actionable child.",
        selector: selector.and(atomic.blocked, selector.property("ID")),
        order: 0,
        tone: "critical",
      }),
      rule({
        id: "waiting",
        title: "Waiting state",
        subtitle: "Rows intentionally blocked by human or external dependency.",
        selector: selector.todo("WAIT", "WAITING"),
        order: 8,
        orderMulti: "tail-review",
        tone: "waiting",
      }),
      rule({
        id: "scheduled",
        title: "Remaining scheduled work",
        subtitle: "Everything scheduled after the narrowing rules has run.",
        selector: atomic.scheduled,
        order: 8,
        orderMulti: "tail-review",
        tone: "steady",
      }),
    ],
  }),
  auto: buildProgram({
    key: "auto",
    label: "Auto Grouping",
    shortLabel: "Auto",
    description: "Turns parser metadata into generated agenda sections.",
    intent: "Use :auto-* selectors as first-class UI structure, not hidden implementation detail.",
    rules: [
      rule({
        id: "auto-priority",
        title: "Priority",
        subtitle: "Creates generated sections from parsed priority cookies and agenda sort keys.",
        selector: selector.auto("priority"),
        order: -1,
        tone: "critical",
      }),
      rule({
        id: "auto-area",
        title: "AREA",
        subtitle: "Creates one section for each AREA property value.",
        selector: selector.auto("property", "AREA"),
        order: 0,
        tone: "focus",
      }),
      rule({
        id: "auto-todo",
        title: "TODO keyword",
        subtitle: "Remaining rows are grouped by TODO state.",
        selector: selector.auto("todo"),
        order: 3,
        tone: "steady",
      }),
      rule({
        id: "auto-tags",
        title: "Tag signature",
        subtitle: "Rows with the same effective tag set collapse into the same section.",
        selector: selector.auto("tags"),
        order: 5,
        tone: "waiting",
      }),
      rule({
        id: "auto-planning",
        title: "Planning date",
        subtitle: "Date buckets mirror :auto-planning for any remaining rows.",
        selector: selector.auto("planning"),
        order: 7,
        tone: "deadline",
      }),
    ],
  }),
  agent: buildProgram({
    key: "agent",
    label: "Agent Context Agenda",
    shortLabel: "Agent",
    description: "Connects agenda evidence with AI-ready context packs.",
    intent:
      "Bridge agenda grouping, parser receipts, and LLM handoff prompts without hiding rules.",
    rules: [
      rule({
        id: "agent-risk",
        title: "Risk handoff",
        subtitle: "Deadlines and blockers become the first agent brief.",
        selector: selector.and(
          selector.or(atomic.deadline, atomic.blocked),
          selector.not(selector.todo("WAIT", "WAITING")),
        ),
        order: -1,
        tone: "critical",
      }),
      rule({
        id: "agent-memory",
        title: "Memory-backed records",
        subtitle:
          "Rows with stable IDs, record tags, or parser receipts are useful prompt context.",
        selector: selector.or(
          atomic.memory,
          selector.property("ID"),
          selector.tag("record", "memory"),
        ),
        order: 0,
        tone: "focus",
        transformer: "agent-context-label",
      }),
      rule({
        id: "agent-attachment",
        title: "Attachment / artifact rows",
        subtitle: "Attachment and research rows are separated for retrieval-aware follow-up.",
        selector: selector.or(selector.tag("attach", "research"), selector.property("DIR")),
        order: 2,
        tone: "waiting",
      }),
      rule({
        id: "agent-log",
        title: "Progress log source",
        subtitle: "DONE/CLOSED rows supply recent progress memory.",
        selector: selector.or(atomic.done, atomic.closed),
        order: 8,
        tone: "done",
      }),
    ],
  }),
};

export const agendaModeDefinitions: Record<AgendaModeKey, AgendaModeDefinition> =
  Object.fromEntries(
    Object.entries(agendaPrograms).map(([key, program]) => [
      key,
      { label: program.shortLabel, description: program.description },
    ]),
  ) as Record<AgendaModeKey, AgendaModeDefinition>;

export const selectorCapabilities: Omit<SuperAgendaSelectorCapability, "active">[] = [
  capability(
    "anything",
    ":anything",
    "Catch all",
    "core",
    "native",
    "Catch-all selector used for Other items and terminal discard rules.",
  ),
  capability(
    "deadline",
    ":deadline",
    "Deadline rows",
    "core",
    "parser-backed",
    "Backed by agendaView kind=deadline from native Org planning.",
  ),
  capability(
    "scheduled",
    ":scheduled",
    "Scheduled rows",
    "core",
    "parser-backed",
    "Backed by agendaView kind=scheduled.",
  ),
  capability(
    "time-grid",
    ":time-grid",
    "Timed rows",
    "core",
    "parser-backed",
    "Backed by parsed Org timestamps with start/end time.",
  ),
  capability(
    "todo",
    ":todo",
    "TODO keyword",
    "core",
    "parser-backed",
    "Uses parsed TODO keyword and done/todo state.",
  ),
  capability(
    "tag",
    ":tag",
    "Effective tags",
    "core",
    "parser-backed",
    "Uses inherited effectiveTags from the parser DTO.",
  ),
  capability(
    "category",
    ":category",
    "Category",
    "core",
    "parser-backed",
    "Available from agendaView category when present.",
  ),
  capability(
    "property",
    ":property",
    "Property drawer",
    "core",
    "parser-backed",
    "Matches parsed Org property drawer values such as AREA, ID, DIR, EFFORT.",
  ),
  capability(
    "log",
    ":log closed",
    "Closed log",
    "core",
    "partial",
    "Closed rows are available; full agenda log-mode clock separation is not wired yet.",
  ),
  capability(
    "children",
    ":children",
    "ORDERED blockers",
    "core",
    "agent-extension",
    "Org Zhixing exposes parser-owned blocker chains instead of recomputing children in TS.",
  ),
  capability(
    "implicit-or",
    "implicit OR",
    "Selector OR",
    "control",
    "native",
    "Multiple selector clauses in a rule are treated as an org-super-agenda OR group.",
  ),
  capability(
    "and",
    ":and",
    "Intersection",
    "control",
    "native",
    "All nested selectors must match before the rule consumes the item.",
  ),
  capability(
    "not",
    ":not",
    "Negation",
    "control",
    "native",
    "Inverts nested selector matches and composes with discard.",
  ),
  capability(
    "discard",
    ":discard",
    "Consume without section",
    "control",
    "native",
    "Matched rows are consumed and do not produce a visible group.",
  ),
  capability(
    "take",
    ":take",
    "Bounded group",
    "control",
    "native",
    "Emits first N matched rows and hides the rest from downstream selectors.",
  ),
  capability(
    "order",
    ":order",
    "Section order",
    "control",
    "native",
    "Groups are sorted by explicit order, then section name.",
  ),
  capability(
    "order-multi",
    ":order-multi",
    "Shared order",
    "control",
    "native",
    "Program source emits shared order blocks and the UI keeps each compiled section interactive.",
  ),
  capability(
    "auto-category",
    ":auto-category",
    "Auto category",
    "auto",
    "native",
    "Execution engine can bucket remaining rows by category.",
  ),
  capability(
    "auto-planning",
    ":auto-planning",
    "Auto planning",
    "auto",
    "native",
    "Buckets rows by display planning date.",
  ),
  capability(
    "auto-property",
    ":auto-property",
    "Auto property",
    "auto",
    "native",
    "Buckets rows by a selected property such as AREA.",
  ),
  capability(
    "auto-tags",
    ":auto-tags",
    "Auto tags",
    "auto",
    "native",
    "Buckets rows by exact effective tag signature.",
  ),
  capability(
    "auto-todo",
    ":auto-todo",
    "Auto TODO",
    "auto",
    "native",
    "Buckets rows by parsed TODO keyword.",
  ),
  capability(
    "auto-group",
    ":auto-group",
    "agenda-group property",
    "auto",
    "partial",
    'Can be expressed as :auto-property "agenda-group"; inheritance policy is still parser-dependent.',
  ),
  capability(
    "auto-priority",
    ":auto-priority",
    "Auto priority",
    "auto",
    "native",
    "Buckets remaining rows by parsed priority cookies exposed through agenda sort keys.",
  ),
  capability(
    "auto-outline-path",
    ":auto-outline-path",
    "Outline path",
    "auto",
    "planned",
    "The view index has outline strings; agenda cards still need stable outline-path linkage.",
  ),
  capability(
    "auto-parent",
    ":auto-parent",
    "Parent heading",
    "auto",
    "planned",
    "Requires parent identity in agenda DTO rather than title-only inference.",
  ),
  capability(
    "auto-ts",
    ":auto-ts",
    "Latest timestamp",
    "auto",
    "planned",
    "Requires a latest-timestamp projection beyond scheduled/deadline/closed.",
  ),
  capability(
    "auto-map",
    ":auto-map",
    "Custom grouping function",
    "auto",
    "planned",
    "Will need a safe typed callback model, not arbitrary browser eval.",
  ),
  capability(
    "face",
    ":face",
    "Visual face",
    "display",
    "partial",
    "Program metadata is preserved and group chrome exposes the token.",
  ),
  capability(
    "transformer",
    ":transformer",
    "Item transformer",
    "display",
    "native",
    "Safe typed transformers can relabel card titles without arbitrary browser eval.",
  ),
  capability(
    "priority",
    ":priority",
    "Priority selector",
    "advanced",
    "parser-backed",
    "Matches priority cookies from agenda sort keys with typed A/B/C comparison.",
  ),
  capability(
    "effort",
    ":effort<= / :effort>=",
    "Effort compare",
    "advanced",
    "parser-backed",
    "Parses EFFORT properties into minutes before comparing selector thresholds.",
  ),
  capability(
    "heading-regexp",
    ":heading-regexp",
    "Heading regexp",
    "advanced",
    "planned",
    "Title text is available, but regexp UI needs safe authoring.",
  ),
  capability(
    "regexp",
    ":regexp",
    "Agenda row regexp",
    "advanced",
    "planned",
    "Full row string matching should be backed by a stable rendered row contract.",
  ),
  capability(
    "pred",
    ":pred",
    "Predicate",
    "advanced",
    "planned",
    "Arbitrary predicates are intentionally deferred for safety and portability.",
  ),
  capability(
    "file-path",
    ":file-path",
    "File path",
    "advanced",
    "planned",
    "Needs source-file identity on agenda cards.",
  ),
  capability(
    "habit",
    ":habit",
    "Habit",
    "advanced",
    "planned",
    "Requires native habit metadata from the parser.",
  ),
  capability(
    "agent-memory",
    "agent:memory",
    "AI memory signal",
    "agent",
    "agent-extension",
    "Org Zhixing adds stable ID, receipts, and memory tags as agent-ready selectors.",
  ),
];

export const selectorCapabilityViews = (
  program: SuperAgendaProgram,
): SuperAgendaSelectorCapability[] => {
  const activeIds = activeCapabilityIds(program);
  return selectorCapabilities.map((capabilityItem) => ({
    ...capabilityItem,
    active:
      capabilityItem.id === "order"
        ? program.rules.some((programRule) => programRule.order !== 0)
        : activeIds.has(capabilityItem.id),
  }));
};

export function selectorToSexp(item: SuperAgendaSelector): string {
  return writeSelector(item);
}

function capability(
  id: string,
  selectorName: string,
  label: string,
  family: SuperAgendaSelectorCapability["family"],
  status: SuperAgendaSelectorCapability["status"],
  detail: string,
): Omit<SuperAgendaSelectorCapability, "active"> {
  return { id, selector: selectorName, label, family, status, detail };
}

function activeCapabilityIds(program: SuperAgendaProgram): Set<string> {
  const ids = new Set<string>();
  for (const programRule of program.rules) {
    collectSelectorCapabilityIds(programRule.selector, ids);
    if (programRule.face) ids.add("face");
    if (programRule.orderMulti) ids.add("order-multi");
    if (programRule.transformer) ids.add("transformer");
  }
  return ids;
}

function collectSelectorCapabilityIds(item: SuperAgendaSelector, ids: Set<string>): void {
  ids.add(capabilityIdForSelector(item));
  switch (item.kind) {
    case "and":
    case "or":
      item.selectors.forEach((inner) => collectSelectorCapabilityIds(inner, ids));
      break;
    case "not":
    case "take":
    case "discard":
      collectSelectorCapabilityIds(item.selector, ids);
      break;
    case "auto":
      if (item.by === "property" && item.property === "agenda-group") ids.add("auto-group");
      break;
    default:
      break;
  }
}

function capabilityIdForSelector(item: SuperAgendaSelector): string {
  switch (item.kind) {
    case "auto":
      return `auto-${item.by}`;
    case "blocked":
      return "children";
    case "closed":
      return "log";
    case "done":
      return "todo";
    case "memory":
      return "agent-memory";
    case "or":
      return "implicit-or";
    case "time-grid":
      return "time-grid";
    default:
      return item.kind;
  }
}

function writeSelector(item: SuperAgendaSelector): string {
  switch (item.kind) {
    case "anything":
      return ":anything t";
    case "blocked":
      return ':and (:children todo :property "ORDERED")';
    case "category":
      return `:category ${selectorValues(item.values)}`;
    case "closed":
      return ":log closed";
    case "deadline":
      return ":deadline t";
    case "done":
      return ':todo ("DONE" "CANCELED")';
    case "memory":
      return ':or (:property "ID" :tag ("record" "memory"))';
    case "effort":
      return `:effort${item.operator} ${quote(item.value)}`;
    case "priority":
      return item.operator === "="
        ? `:priority ${quote(item.value)}`
        : `:priority${item.operator} ${quote(item.value)}`;
    case "property":
      return item.values
        ? `:property (${quote(item.key)} ${selectorValues(item.values)})`
        : `:property ${quote(item.key)}`;
    case "scheduled":
      return ":scheduled t";
    case "tag":
      return `:tag ${selectorValues(item.values)}`;
    case "time-grid":
      return ":time-grid t";
    case "todo":
      return `:todo ${selectorValues(item.values)}`;
    case "and":
      return `:and (${item.selectors.map(writeSelector).join(" ")})`;
    case "not":
      return `:not (${writeSelector(item.selector)})`;
    case "or":
      return item.selectors.map(writeSelector).join(" ");
    case "take":
      return `:take (${item.count} (${writeSelector(item.selector)}))`;
    case "discard":
      return `:discard (${writeSelector(item.selector)})`;
    case "auto":
      return item.by === "property"
        ? `:auto-property ${quote(item.property ?? "")}`
        : `:auto-${item.by} t`;
  }
}

function buildProgram(program: Omit<SuperAgendaProgram, "source">): SuperAgendaProgram {
  return {
    ...program,
    source: programSource(program),
  };
}

function rule(definition: SuperAgendaProgramRule): SuperAgendaProgramRule {
  return definition;
}

function programSource(program: Omit<SuperAgendaProgram, "source">): string {
  const consumed = new Set<string>();
  const lines = program.rules.flatMap((programRule) => {
    if (!programRule.orderMulti || consumed.has(programRule.id)) {
      return consumed.has(programRule.id) ? [] : [`  ${programRuleSource(programRule, true)}`];
    }

    const siblings = program.rules.filter(
      (ruleItem) => ruleItem.orderMulti === programRule.orderMulti,
    );
    if (siblings.length < 2) {
      return [`  ${programRuleSource(programRule, true)}`];
    }

    siblings.forEach((ruleItem) => consumed.add(ruleItem.id));
    return [
      `  (:order-multi (${programRule.order}\n${siblings
        .map((ruleItem) => `    ${programRuleSource(ruleItem, false)}`)
        .join("\n")}))`,
    ];
  });
  return `(setq org-super-agenda-groups\n '(\n${lines.join("\n")}\n   ))`;
}

function programRuleSource(programRule: SuperAgendaProgramRule, includeOrder: boolean): string {
  const attrs = [
    `:name ${quote(programRule.title)}`,
    selectorToSexp(programRule.selector),
    includeOrder && programRule.order !== 0 ? `:order ${programRule.order}` : null,
    programRule.face ? `:face ${quote(programRule.face)}` : null,
    programRule.transformer ? `:transformer ${quote(programRule.transformer)}` : null,
  ].filter(Boolean);
  return `(${attrs.join("\n   ")})`;
}

function selectorValues(values: string[]): string {
  return values.length === 1 ? quote(values[0]) : `(${values.map(quote).join(" ")})`;
}

function quote(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}
