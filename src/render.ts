import type {
  OrgizeAgendaViewSkipDto,
  OrgizeLintFindingDto,
  OrgizeViewIndexRecordDto,
} from "orgize/dto";
import type {
  AgendaCardView,
  AgendaItem,
  OrgizeDocumentView,
  SuperAgendaGroup,
  SuperAgendaWorkspace,
  ViewKey,
} from "./model";
import type { AgendaModeKey } from "./config";
import { agendaItems, agendaModeDefinitions, superAgendaWorkspace, taggedRecords } from "./model";

type TimingStats = {
  parseMs?: number;
  agendaMs?: number;
  lintMs?: number;
  htmlMs?: number;
};

export const renderView = (
  view: ViewKey,
  document: OrgizeDocumentView | null,
  pendingMessage = "",
  agendaMode: AgendaModeKey = "focus",
): string => {
  if (pendingMessage) {
    return `<div class="empty">${escapeHtml(pendingMessage)}</div>`;
  }
  if (!document) {
    return `<div class="empty">Loading Org parser...</div>`;
  }

  switch (view) {
    case "blog":
      return renderRecords(taggedRecords(document, "blog"), "Blog");
    case "records":
      return renderRecords(taggedRecords(document, "record"), "Records");
    case "agenda":
      return renderAgenda(document, agendaMode);
    case "diagnostics":
      return document.lint
        ? renderDiagnostics(document.lint)
        : `<div class="empty">Loading lint...</div>`;
  }
};

export const renderStats = (
  document: OrgizeDocumentView | null,
  timings: TimingStats = {},
  showPerformance = true,
): string => {
  if (!document) {
    return "No document";
  }
  const lintCount = document.lint?.length;
  const timingText = showPerformance
    ? [
        timings.parseMs === undefined ? null : `parse ${formatMs(timings.parseMs)}`,
        timings.agendaMs === undefined ? null : `agenda ${formatMs(timings.agendaMs)}`,
        timings.lintMs === undefined ? null : `lint ${formatMs(timings.lintMs)}`,
        timings.htmlMs === undefined ? null : `html ${formatMs(timings.htmlMs)}`,
      ]
        .filter(Boolean)
        .join(" / ")
    : "";
  const lintText = lintCount === undefined ? "lint lazy" : `${lintCount} lint`;
  return [
    `${document.counts.blog} blog`,
    `${document.counts.records} records`,
    `${document.counts.agenda} agenda`,
    lintText,
    timingText,
  ]
    .filter(Boolean)
    .join(" / ");
};

const renderRecords = (records: OrgizeViewIndexRecordDto[], label: string): string => {
  if (records.length === 0) {
    return `<div class="empty">No ${label.toLowerCase()} records found.</div>`;
  }
  return `<div class="card-grid">${records.map(renderRecordCard).join("")}</div>`;
};

const renderRecordCard = (record: OrgizeViewIndexRecordDto): string => `
  <article class="card">
    <div class="card-kicker">${escapeHtml(record.outline)}</div>
    <h2>${escapeHtml(record.title)}</h2>
    <p>${escapeHtml(record.bodyPreview)}</p>
    <div class="meta-row">
      ${record.effectiveTags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}
    </div>
    ${renderProperties(record)}
  </article>
`;

const renderProperties = (record: OrgizeViewIndexRecordDto): string => {
  const visible = record.properties.slice(0, 4);
  if (visible.length === 0) {
    return "";
  }
  return `<dl class="properties">${visible
    .map(
      (property) =>
        `<div><dt>${escapeHtml(property.key)}</dt><dd>${escapeHtml(property.value)}</dd></div>`,
    )
    .join("")}</dl>`;
};

const renderAgenda = (document: OrgizeDocumentView, agendaMode: AgendaModeKey): string => {
  const workspace = superAgendaWorkspace(document, agendaMode);
  if (!workspace) {
    return renderAgendaFallback(agendaItems(document));
  }
  if (workspace.totalCandidates === 0) {
    return `<div class="empty">No agenda rows in ${escapeHtml(workspace.rangeLabel)}.</div>`;
  }
  return `
    <section class="super-agenda">
      <header class="agenda-hero">
        <div>
          <p class="eyebrow">Agenda Intelligence</p>
          <h2>${escapeHtml(workspace.rangeLabel)}</h2>
          <p>${escapeHtml(workspace.modeDescription)}</p>
        </div>
        <dl class="agenda-metrics">
          <div><dt>Visible</dt><dd>${workspace.visibleCount}</dd></div>
          <div><dt>Total</dt><dd>${workspace.totalCandidates}</dd></div>
          <div><dt>Limit</dt><dd>${workspace.limit ?? "none"}</dd></div>
        </dl>
      </header>
      ${renderAgendaModeControls(workspace.mode)}
      <div class="agenda-insights">
        ${workspace.insights.map((insight) => `<span>${escapeHtml(insight)}</span>`).join("")}
      </div>
      <div class="agenda-groups">
        ${workspace.groups.map(renderSuperAgendaGroup).join("")}
      </div>
      ${renderSkippedAgenda(workspace)}
    </section>
  `;
};

const renderAgendaModeControls = (activeMode: AgendaModeKey): string => `
  <div class="agenda-mode-bar" role="group" aria-label="Agenda mode">
    ${Object.entries(agendaModeDefinitions)
      .map(
        ([mode, definition]) => `
          <button
            type="button"
            data-agenda-mode="${escapeHtml(mode)}"
            class="${mode === activeMode ? "active" : ""}"
          >
            <strong>${escapeHtml(definition.label)}</strong>
            <span>${escapeHtml(definition.description)}</span>
          </button>
        `,
      )
      .join("")}
  </div>
`;

const renderAgendaFallback = (items: AgendaItem[]): string => {
  if (items.length === 0) {
    return `<div class="empty">No scheduled, deadline, or closed planning data found.</div>`;
  }
  return `
    <section class="agenda-loading">
      <div class="empty">Projecting parser-owned agenda intelligence...</div>
      <ol class="agenda-list">${items.map(renderFallbackAgendaItem).join("")}</ol>
    </section>
  `;
};

const renderFallbackAgendaItem = (item: AgendaItem): string => `
  <li>
    <span class="agenda-kind ${item.kind}">${item.kind}</span>
    <strong>${escapeHtml(item.title)}</strong>
    <code>${escapeHtml(item.value)}</code>
    <small>${item.tags.map(escapeHtml).join(" ")}</small>
  </li>
`;

const renderSuperAgendaGroup = (group: SuperAgendaGroup): string => `
  <details class="agenda-group agenda-group--${group.tone}" open>
    <summary>
      <span>
        <strong>${escapeHtml(group.title)}</strong>
        <small>${escapeHtml(group.subtitle)}</small>
      </span>
      <b>${group.cards.length}</b>
    </summary>
    <div class="agenda-card-stack">
      ${group.cards.map(renderAgendaCard).join("")}
    </div>
  </details>
`;

const renderAgendaCard = (card: AgendaCardView): string => `
  <article class="agenda-card agenda-card--${card.pressure}">
    <div class="agenda-card-main">
      <span class="agenda-kind ${escapeHtml(card.kind)}">${escapeHtml(card.kind)}</span>
      <div>
        <h3>${escapeHtml(card.title)}</h3>
        <p>${escapeHtml(card.displayDate)}${card.time ? ` at ${escapeHtml(card.time)}` : ""}</p>
      </div>
    </div>
    <div class="agenda-signal-row">
      ${card.signals
        .slice(0, 8)
        .map((signal) => `<span>${escapeHtml(signal)}</span>`)
        .join("")}
    </div>
    ${renderBlockers(card)}
    <details class="agenda-receipts">
      <summary>Why this card is here</summary>
      <ul>
        ${card.receipts.map((receipt) => `<li>${escapeHtml(receipt.message)}</li>`).join("")}
      </ul>
      <p>Source line ${card.source.start.line}, sorted #${card.sortedPosition}</p>
      <p>${card.sortKeys
        .map((key) => `${key.key}: ${key.value}`)
        .map(escapeHtml)
        .join(" / ")}</p>
    </details>
  </article>
`;

const renderBlockers = (card: AgendaCardView): string => {
  if (card.blockers.length === 0) {
    return "";
  }
  return `<div class="agenda-blockers">${card.blockers
    .map(
      (blocker) =>
        `<span>${escapeHtml(blocker.message)}: ${escapeHtml(blocker.blocker.title)}</span>`,
    )
    .join("")}</div>`;
};

const renderSkippedAgenda = (workspace: SuperAgendaWorkspace): string => {
  if (workspace.skipped.length === 0) {
    return "";
  }
  return `
    <details class="agenda-skipped">
      <summary>${workspace.skippedCount} skipped candidates</summary>
      <ol>
        ${workspace.skipped.map(renderSkippedAgendaItem).join("")}
      </ol>
    </details>
  `;
};

const renderSkippedAgendaItem = (item: OrgizeAgendaViewSkipDto): string => `
  <li>
    <strong>${escapeHtml(item.title)}</strong>
    <span>${escapeHtml(item.reason)}</span>
    <small>sorted #${item.sortedPosition}</small>
  </li>
`;

const renderDiagnostics = (findings: OrgizeLintFindingDto[]): string => {
  if (findings.length === 0) {
    return `<div class="empty">No lint findings.</div>`;
  }
  return `<ol class="diagnostics">${findings
    .map(
      (finding) => `
        <li>
          <strong>${escapeHtml(finding.code)}</strong>
          <span>${escapeHtml(finding.severity)}</span>
          <p>${escapeHtml(finding.message)}</p>
        </li>
      `,
    )
    .join("")}</ol>`;
};

const escapeHtml = (value: string | number): string =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const formatMs = (value: number): string => {
  if (value < 10) {
    return `${value.toFixed(1)}ms`;
  }
  return `${Math.round(value)}ms`;
};
