import type { AgendaPanelKey, SuperAgendaWorkspace } from "./agendaTypes";

export const renderAgendaInspector = (
  workspace: SuperAgendaWorkspace,
  activePanel: AgendaPanelKey,
  activeRuleId: string | null,
): string => `
  <div class="agenda-panel-tabs agenda-panel-tabs--wide" role="tablist" aria-label="Agenda inspector">
    ${renderAgendaPanelTab("trace", "Trace", activePanel)}
    ${renderAgendaPanelTab("selectors", "Selectors", activePanel)}
    ${renderAgendaPanelTab("source", "Program", activePanel)}
    ${renderAgendaPanelTab("agent", "Agent", activePanel)}
    ${renderAgendaPanelTab("records", "Records", activePanel)}
  </div>
  ${renderActiveAgendaPanel(workspace, activePanel, activeRuleId)}
`;

const renderAgendaPanelTab = (
  panel: AgendaPanelKey,
  label: string,
  activePanel: AgendaPanelKey,
): string => `
  <button
    type="button"
    role="tab"
    aria-selected="${panel === activePanel}"
    data-agenda-panel="${panel}"
    class="${panel === activePanel ? "active" : ""}"
  >
    ${escapeHtml(label)}
  </button>
`;

const renderActiveAgendaPanel = (
  workspace: SuperAgendaWorkspace,
  activePanel: AgendaPanelKey,
  activeRuleId: string | null,
): string => {
  switch (activePanel) {
    case "trace":
      return renderExecutionTrace(workspace, activeRuleId);
    case "selectors":
      return renderSelectorCoverage(workspace);
    case "source":
      return renderProgramSource(workspace);
    case "agent":
      return renderAgentPanel(workspace);
    case "records":
      return renderRecordsPanel(workspace);
  }
};

const renderExecutionTrace = (
  workspace: SuperAgendaWorkspace,
  activeRuleId: string | null,
): string => `
  <section class="agenda-panel-card agenda-trace">
    <div class="agenda-section-heading">
      <span>Selector execution</span>
      <strong>${workspace.visibleCount} input rows</strong>
    </div>
    <ol>
      ${workspace.trace
        .map(
          (step, index) => `
            <li
              class="trace-step trace-step--${step.tone} ${step.ruleId === activeRuleId ? "trace-step--selected" : ""}"
              data-agenda-trace-rule="${escapeHtml(step.ruleId)}"
            >
              <details ${index < 3 ? "open" : ""}>
                <summary data-agenda-rule-select="${escapeHtml(step.ruleId)}">
                  <span class="selector-index">${index + 1}</span>
                  <code>${escapeHtml(step.selector)}</code>
                  <b>${escapeHtml(step.operation)}</b>
                </summary>
                <div class="trace-step-body">
                  <strong>${escapeHtml(step.title)}</strong>
                  <p>${escapeHtml(step.note)}</p>
                  <dl>
                    <div><dt>matched</dt><dd>${step.matchedCount}</dd></div>
                    <div><dt>emitted</dt><dd>${step.emittedCount}</dd></div>
                    <div><dt>consumed</dt><dd>${step.consumedCount}</dd></div>
                    <div><dt>discarded</dt><dd>${step.discardedCount}</dd></div>
                    <div><dt>input</dt><dd>${step.inputCount}</dd></div>
                    <div><dt>remain</dt><dd>${step.remainingAfter}</dd></div>
                    <div><dt>order</dt><dd>${step.order}</dd></div>
                  </dl>
                  ${renderTraceOutputs(step.outputTitles)}
                </div>
              </details>
            </li>
          `,
        )
        .join("")}
    </ol>
  </section>
`;

const renderTraceOutputs = (outputs: string[]): string => {
  if (outputs.length === 0) {
    return `<p class="trace-empty">No visible section emitted.</p>`;
  }
  return `<div class="trace-output">${outputs
    .slice(0, 6)
    .map((output) => `<span>${escapeHtml(output)}</span>`)
    .join("")}</div>`;
};

const renderSelectorCoverage = (workspace: SuperAgendaWorkspace): string => `
  <section class="agenda-panel-card agenda-selector-coverage">
    <div class="agenda-section-heading">
      <span>Super-agenda selector coverage</span>
      <strong>${workspace.capabilitySummary.implemented}/${workspace.capabilitySummary.total} modeled</strong>
    </div>
    <dl class="selector-coverage-summary">
      <div><dt>active</dt><dd>${workspace.capabilitySummary.active}</dd></div>
      <div><dt>planned</dt><dd>${workspace.capabilitySummary.planned}</dd></div>
      <div><dt>program</dt><dd>${escapeHtml(workspace.program.shortLabel)}</dd></div>
    </dl>
    <div class="selector-capability-stack">
      ${renderCapabilityFamily(workspace, "control", "Control flow")}
      ${renderCapabilityFamily(workspace, "core", "Core selectors")}
      ${renderCapabilityFamily(workspace, "auto", "Auto groups")}
      ${renderCapabilityFamily(workspace, "display", "Faces and transforms")}
      ${renderCapabilityFamily(workspace, "agent", "Org Zhixing extensions")}
      ${renderCapabilityFamily(workspace, "advanced", "Advanced backlog")}
    </div>
  </section>
`;

const renderCapabilityFamily = (
  workspace: SuperAgendaWorkspace,
  family: SuperAgendaWorkspace["selectorCapabilities"][number]["family"],
  label: string,
): string => {
  const capabilities = workspace.selectorCapabilities.filter(
    (capability) => capability.family === family,
  );
  if (capabilities.length === 0) {
    return "";
  }
  return `
    <details class="selector-capability-family" ${family !== "advanced" ? "open" : ""}>
      <summary>
        <span>${escapeHtml(label)}</span>
        <b>${capabilities.filter((capability) => capability.active).length}/${capabilities.length}</b>
      </summary>
      <ol>
        ${capabilities.map(renderSelectorCapability).join("")}
      </ol>
    </details>
  `;
};

const renderSelectorCapability = (
  capability: SuperAgendaWorkspace["selectorCapabilities"][number],
): string => `
  <li class="selector-capability selector-capability--${capability.status} ${capability.active ? "selector-capability--active" : ""}">
    <div>
      <code>${escapeHtml(capability.selector)}</code>
      <strong>${escapeHtml(capability.label)}</strong>
      <p>${escapeHtml(capability.detail)}</p>
    </div>
    <span>${escapeHtml(capability.active ? "active" : capability.status)}</span>
  </li>
`;

const renderProgramSource = (workspace: SuperAgendaWorkspace): string => `
  <section class="agenda-panel-card agenda-program-source">
    <div class="agenda-section-heading">
      <span>Executable shape</span>
      <strong>${workspace.program.rules.length} rules</strong>
    </div>
    <pre><code>${escapeHtml(workspace.program.source)}</code></pre>
    <div class="agenda-source-grid">
      <section>
        <h3>Sort strategy</h3>
        <ol>
          ${workspace.sortSteps
            .map(
              (step, index) => `
                <li>
                  <b>${index + 1}</b>
                  <span>${escapeHtml(step.label)}</span>
                  <small>${escapeHtml(step.direction)} / ${escapeHtml(step.detail)}</small>
                </li>
              `,
            )
            .join("")}
        </ol>
      </section>
      <section>
        <h3>Runtime result</h3>
        <dl>
          <div><dt>visible</dt><dd>${workspace.visibleCount}</dd></div>
          <div><dt>consumed</dt><dd>${workspace.consumedCount}</dd></div>
          <div><dt>discarded</dt><dd>${workspace.discardedCount}</dd></div>
          <div><dt>unmatched</dt><dd>${workspace.unmatchedCount}</dd></div>
        </dl>
      </section>
    </div>
  </section>
`;

const renderAgentPanel = (workspace: SuperAgendaWorkspace): string => `
  <section class="agenda-panel-card agenda-agent-panel">
    <div class="agenda-section-heading">
      <span>AI handoff from compiled agenda</span>
      <strong>${escapeHtml(workspace.program.shortLabel)}</strong>
    </div>
    <h3>${escapeHtml(workspace.agentBrief.headline)}</h3>
    <p>${escapeHtml(workspace.agentBrief.summary)}</p>
    <ol class="agenda-agent-actions">
      ${workspace.agentBrief.recommendations
        .map(
          (recommendation, index) => `
            <li>
              <b>${index + 1}</b>
              <span>${escapeHtml(recommendation)}</span>
            </li>
          `,
        )
        .join("")}
    </ol>
    <div class="agenda-prompt-stack">
      ${workspace.agentBrief.prompts
        .map(
          (prompt, index) => `
            <details ${index === 0 ? "open" : ""}>
              <summary>Prompt ${index + 1}</summary>
              <p>${escapeHtml(prompt)}</p>
            </details>
          `,
        )
        .join("")}
    </div>
  </section>
`;

const renderRecordsPanel = (workspace: SuperAgendaWorkspace): string => `
  <section class="agenda-panel-card agenda-capture-log">
    <div class="agenda-section-heading">
      <span>Record trail</span>
      <strong>${workspace.agentBrief.captureLog.length}</strong>
    </div>
    <ol>
      ${workspace.agentBrief.captureLog
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
`;

const escapeHtml = (value: string | number): string =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
