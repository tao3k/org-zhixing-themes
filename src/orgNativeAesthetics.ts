import type { OrgizeDocumentView } from "./model";
import {
  headingLevel,
  matchHeadingRecord,
  sectionRecords,
  type SectionRecord,
} from "./orgHtmlMetadata";
import {
  hasExplicitOrgPriority,
  orgPriorityLabel,
  orgPriorityTone,
  orgTodoTone,
} from "./orgSemanticTone";

export const enhanceOrgNativeAesthetics = (
  root: ParentNode,
  documentView: OrgizeDocumentView,
): void => {
  decorateHeadings(root, documentView);
  enhanceInlineTimestamps(root);
  enhanceOrgTables(root);
  enhanceOrgBlocks(root);
  enhanceAttributeBackedCheckboxes(root);
};

const decorateHeadings = (root: ParentNode, documentView: OrgizeDocumentView): void => {
  const records = sectionRecords(documentView);
  if (records.length === 0) {
    return;
  }
  const used = new Set<SectionRecord>();
  for (const heading of root.querySelectorAll<HTMLHeadingElement>("h1,h2,h3,h4,h5,h6")) {
    const record = matchHeadingRecord(heading, records, used);
    if (!record) {
      continue;
    }
    used.add(record);
    decorateHeading(heading, record);
  }
};

const decorateHeading = (heading: HTMLHeadingElement, record: SectionRecord): void => {
  if (heading.querySelector(":scope > .org-heading-markers")) {
    return;
  }
  heading.classList.add("org-heading", `org-heading--level-${headingLevel(heading)}`);
  const markers = heading.ownerDocument.createElement("span");
  markers.className = "org-heading-markers";

  if (record.todo) {
    const todo = heading.ownerDocument.createElement("span");
    todo.className = `org-heading-todo org-heading-todo--${orgTodoTone(record.todo, record.todoState)}`;
    todo.textContent = record.todo;
    markers.append(todo);
  }

  if (hasExplicitOrgPriority(record.priority)) {
    const priority = heading.ownerDocument.createElement("span");
    priority.className = `org-heading-priority org-priority--${orgPriorityTone(record.priority)}`;
    priority.textContent = orgPriorityLabel(record.priority);
    markers.append(priority);
  }

  if (markers.childElementCount === 0) {
    return;
  }

  const title = heading.ownerDocument.createElement("span");
  title.className = "org-heading-title";
  while (heading.firstChild) {
    title.append(heading.firstChild);
  }
  heading.append(markers, title);
};

const enhanceInlineTimestamps = (root: ParentNode): void => {
  for (const timestamp of root.querySelectorAll<HTMLElement>(".timestamp-wrapper > .timestamp")) {
    if (timestamp.classList.contains("org-timestamp")) {
      continue;
    }
    const raw = (timestamp.textContent ?? "").trim();
    const semantic = timestamp.ownerDocument.createElement(
      timestampDatetime(raw) ? "time" : "span",
    );
    for (const attribute of timestamp.getAttributeNames()) {
      semantic.setAttribute(attribute, timestamp.getAttribute(attribute) ?? "");
    }
    semantic.className = timestamp.className;
    semantic.classList.add("org-timestamp", `org-timestamp--${timestampKind(raw)}`);
    semantic.textContent = raw;
    semantic.dataset.orgTimestamp = "inline";
    const datetime = timestampDatetime(raw);
    if (datetime) {
      semantic.setAttribute("datetime", datetime);
    }
    timestamp.replaceWith(semantic);
    semantic.parentElement?.classList.add("org-timestamp-wrapper");
  }
};

const timestampKind = (raw: string): "active" | "inactive" | "raw" => {
  if (raw.startsWith("<")) {
    return "active";
  }
  if (raw.startsWith("[")) {
    return "inactive";
  }
  return "raw";
};

const timestampDatetime = (raw: string): string | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})\s+\S+(?:\s+(\d{1,2}):(\d{2}))?/.exec(raw.slice(1));
  if (!match) {
    return null;
  }
  const [, year, month, day, hour, minute] = match;
  return hour
    ? `${year}-${month}-${day}T${hour.padStart(2, "0")}:${minute}`
    : `${year}-${month}-${day}`;
};

const enhanceOrgTables = (root: ParentNode): void => {
  for (const table of root.querySelectorAll<HTMLTableElement>("table")) {
    if (table.closest(".org-table-frame")) {
      continue;
    }
    table.classList.add("org-native-table");
    table.dataset.orgColumns = String(maxColumnCount(table));
    promoteTableHeaderCells(table);

    const frame = table.ownerDocument.createElement("div");
    frame.className = "org-table-frame";
    table.replaceWith(frame);
    frame.append(table);
  }
};

const maxColumnCount = (table: HTMLTableElement): number =>
  Math.max(
    0,
    ...[...table.querySelectorAll("tr")].map((row) => row.querySelectorAll("th,td").length),
  );

const promoteTableHeaderCells = (table: HTMLTableElement): void => {
  for (const cell of table.querySelectorAll<HTMLTableCellElement>("thead td")) {
    const header = table.ownerDocument.createElement("th");
    for (const attribute of cell.getAttributeNames()) {
      header.setAttribute(attribute, cell.getAttribute(attribute) ?? "");
    }
    header.setAttribute("scope", "col");
    while (cell.firstChild) {
      header.append(cell.firstChild);
    }
    cell.replaceWith(header);
  }
};

const enhanceOrgBlocks = (root: ParentNode): void => {
  for (const pre of root.querySelectorAll<HTMLPreElement>("pre")) {
    if (pre.closest(".org-block-frame")) {
      continue;
    }
    const code = pre.querySelector("code");
    const language = code ? codeLanguage(code) : null;
    const kind = language ? "src" : pre.classList.contains("example") ? "example" : "block";
    pre.classList.add("org-native-block", `org-native-block--${kind}`);
    wrapBlock(pre, blockLabel(kind, language));
  }
};

const codeLanguage = (code: HTMLElement): string | null => {
  for (const className of code.classList) {
    if (className.startsWith("language-")) {
      return className.slice("language-".length);
    }
  }
  return null;
};

const blockLabel = (kind: string, language: string | null): string => {
  if (kind === "src") {
    return language ? `SRC · ${language}` : "SRC";
  }
  return kind.toUpperCase();
};

const wrapBlock = (pre: HTMLPreElement, labelText: string): void => {
  const frame = pre.ownerDocument.createElement("figure");
  frame.className = "org-block-frame";
  const label = pre.ownerDocument.createElement("figcaption");
  label.className = "org-block-name";
  label.textContent = labelText;
  pre.replaceWith(frame);
  frame.append(label, pre);
};

const enhanceAttributeBackedCheckboxes = (root: ParentNode): void => {
  for (const item of root.querySelectorAll<HTMLLIElement>("li[data-checkbox], li[aria-checked]")) {
    const state = item.dataset.checkbox ?? item.getAttribute("aria-checked") ?? "";
    if (!state || item.querySelector(":scope > .org-checkbox")) {
      continue;
    }
    item.classList.add("org-checkbox-item", `org-checkbox-item--${state}`);
    const marker = item.ownerDocument.createElement("span");
    marker.className = "org-checkbox";
    marker.setAttribute("aria-hidden", "true");
    marker.textContent = checkboxGlyph(state);
    item.prepend(marker);
  }
};

const checkboxGlyph = (state: string): string => {
  if (["true", "checked", "on"].includes(state)) return "✓";
  if (["mixed", "partial", "indeterminate"].includes(state)) return "−";
  return "";
};
