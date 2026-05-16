import type {
  OrgizeAgendaViewSkipDto,
  OrgizeLintFindingDto,
  OrgizeViewIndexRecordDto,
} from "orgize/dto";
import type { AgendaItem, OrgizeDocumentView, ViewKey } from "./model";
import type { AgendaCardView, SuperAgendaGroup, SuperAgendaWorkspace } from "./agendaTypes";
import type { AgendaModeKey } from "./config";
import { agendaItems, taggedRecords } from "./model";
import { agendaModeDefinitions, superAgendaWorkspace } from "./agendaModel";

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
    <section class="super-agenda agenda-cockpit">
      <header class="agenda-command-center">
        <div class="agenda-command-copy">
          <p class="eyebrow">AI x Super Agenda</p>
          <h2>${escapeHtml(workspace.aiBrief.headline)}</h2>
          <p>${escapeHtml(workspace.modeDescription)}</p>
          <div class="agenda-command-badges">
            <span>parser-owned</span>
            <span>selector pipeline</span>
            <span>LLM context pack</span>
          </div>
        </div>
        <dl class="agenda-metrics agenda-metrics--cockpit">
          ${workspace.metrics.map(renderAgendaMetric).join("")}
        </dl>
      </header>
      ${renderAgendaModeControls(workspace.mode)}
      <div class="agenda-insights agenda-insights--dense">
        <strong>${escapeHtml(workspace.rangeLabel)}</strong>
        ${workspace.insights.map((insight) => `<span>${escapeHtml(insight)}</span>`).join("")}
      </div>
      <div class="agenda-cockpit-grid">
        <div class="agenda-mainframe">
          ${renderSelectorPipeline(workspace)}
          <div class="agenda-groups">
            ${workspace.groups.map(renderSuperAgendaGroup).join("")}
          </div>
          ${renderSkippedAgenda(workspace)}
        </div>
        ${renderAgendaAiPanel(workspace)}
      </div>
    </section>
  `;
};

const renderAgendaMetric = (metric: SuperAgendaWorkspace["metrics"][number]): string => `
  <div class="agenda-metric agenda-metric--${metric.tone}">
    <dt>${escapeHtml(metric.label)}</dt>
    <dd>${escapeHtml(metric.value)}</dd>
    <small>${escapeHtml(metric.detail)}</small>
  </div>
`;

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

const renderSelectorPipeline = (workspace: SuperAgendaWorkspace): string => `
  <section class="agenda-selector-pipeline">
    <div class="agenda-section-heading">
      <span>Super-agenda selector pipeline</span>
      <strong>${workspace.selectorRules.length} active groups</strong>
    </div>
    <ol>
      ${workspace.selectorRules
        .map(
          (rule, index) => `
            <li class="selector-rule selector-rule--${rule.tone}">
              <span class="selector-index">${index + 1}</span>
              <code>${escapeHtml(rule.selector)}</code>
              <div>
                <strong>${escapeHtml(rule.label)}</strong>
                <small>${escapeHtml(rule.description)}</small>
              </div>
              <b>${rule.count}</b>
            </li>
          `,
        )
        .join("")}
    </ol>
  </section>
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
      <span class="agenda-group-title">
        <code>${escapeHtml(group.selector)}</code>
        <strong>${escapeHtml(group.title)}</strong>
        <small>${escapeHtml(group.subtitle)}</small>
      </span>
      <span class="agenda-group-count">
        <b>${group.cards.length}</b>
        <small>consumed</small>
      </span>
    </summary>
    <div class="agenda-card-stack">
      ${group.cards.map(renderAgendaCard).join("")}
    </div>
  </details>
`;

const renderAgendaCard = (card: AgendaCardView): string => `
  <article class="agenda-card agenda-card--${card.pressure}">
    <header class="agenda-card-main">
      <div class="agenda-kind-stack">
        <span class="agenda-kind ${escapeHtml(card.kind)}">${escapeHtml(card.kind)}</span>
        <small>${escapeHtml(card.aiState)}</small>
      </div>
      <div>
        <h3>${escapeHtml(card.title)}</h3>
        <p>${escapeHtml(card.displayDate)}${card.time ? ` at ${escapeHtml(card.time)}` : ""}</p>
      </div>
      <span class="agenda-card-position">#${card.sortedPosition}</span>
    </header>
    <div class="agenda-signal-row">
      ${card.signals
        .slice(0, 8)
        .map((signal) => `<span>${escapeHtml(signal)}</span>`)
        .join("")}
    </div>
    ${renderBlockers(card)}
    <div class="agenda-evidence-grid">
      ${renderReceiptRail(card)}
      ${renderMemoryRail(card)}
    </div>
  </article>
`;

const renderReceiptRail = (card: AgendaCardView): string => `
  <section class="agenda-receipt-rail">
    <div class="agenda-mini-heading">
      <strong>Receipts</strong>
      <span>${card.receipts.length}</span>
    </div>
    <ul>
      ${card.receipts
        .slice(0, 3)
        .map((receipt) => `<li>${escapeHtml(receipt.message)}</li>`)
        .join("")}
    </ul>
  </section>
`;

const renderMemoryRail = (card: AgendaCardView): string => `
  <section class="agenda-memory-rail">
    <div class="agenda-mini-heading">
      <strong>Context</strong>
      <span>${card.memorySignals.length}</span>
    </div>
    <p>Source line ${card.source.start.line}</p>
    <div class="agenda-signal-row agenda-signal-row--compact">
      ${[
        ...card.memorySignals,
        ...card.sortKeys.slice(0, 4).map((key) => `${key.key}: ${key.value}`),
      ]
        .map((signal) => `<span>${escapeHtml(signal)}</span>`)
        .join("")}
    </div>
  </section>
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

const renderAgendaAiPanel = (workspace: SuperAgendaWorkspace): string => `
  <aside class="agenda-ai-panel">
    <section class="agenda-ai-brief">
      <div class="agenda-section-heading">
        <span>AI agenda brief</span>
        <strong>${escapeHtml(workspace.modeLabel)}</strong>
      </div>
      <h3>${escapeHtml(workspace.aiBrief.headline)}</h3>
      <p>${escapeHtml(workspace.aiBrief.summary)}</p>
      <ol class="agenda-ai-actions">
        ${workspace.aiBrief.recommendations
          .map((recommendation) => `<li>${escapeHtml(recommendation)}</li>`)
          .join("")}
      </ol>
    </section>
    <section class="agenda-context-pack">
      <div class="agenda-section-heading">
        <span>Prompt pack</span>
        <strong>${workspace.aiBrief.prompts.length}</strong>
      </div>
      ${workspace.aiBrief.prompts.map((prompt) => `<p>${escapeHtml(prompt)}</p>`).join("")}
    </section>
    <section class="agenda-sort-stack">
      <div class="agenda-section-heading">
        <span>Sort strategy</span>
        <strong>${workspace.sortSteps.length}</strong>
      </div>
      <ol>
        ${workspace.sortSteps
          .map(
            (step) => `
              <li>
                <strong>${escapeHtml(step.label)}</strong>
                <span>${escapeHtml(step.direction)} / ${escapeHtml(step.detail)}</span>
              </li>
            `,
          )
          .join("")}
      </ol>
    </section>
    <section class="agenda-capture-log">
      <div class="agenda-section-heading">
        <span>Record trail</span>
        <strong>${workspace.aiBrief.captureLog.length}</strong>
      </div>
      <ol>
        ${workspace.aiBrief.captureLog
          .map(
            (entry) => `
              <li class="capture-entry capture-entry--${entry.tone}">
                <strong>${escapeHtml(entry.title)}</strong>
                <span>${escapeHtml(entry.label)}</span>
                <small>${escapeHtml(entry.detail)}</small>
              </li>
            `,
          )
          .join("")}
      </ol>
    </section>
  </aside>
`;

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
