import type { OrgizeAgentCapturePlanResponseDto, OrgizeAgentCaptureRequestDto } from "orgize/dto";
import type { OrgizeDocumentView } from "./model";

export const renderAgentCapture = (document: OrgizeDocumentView): string => {
  if (!document.capturePlan || !document.captureRequest || !document.captureApplyPreview) {
    return `<div class="empty">Loading Agent capture projection...</div>`;
  }
  return renderCaptureWorkbench(
    document.capturePlan,
    document.captureRequest,
    document.captureApplyPreview,
  );
};

const renderCaptureWorkbench = (
  response: OrgizeAgentCapturePlanResponseDto,
  request: OrgizeAgentCaptureRequestDto,
  applyPreview: NonNullable<OrgizeDocumentView["captureApplyPreview"]>,
): string => {
  const plan = response.plan;
  return `
    <section class="capture-workbench">
      <header class="capture-header">
        <div>
          <p class="eyebrow">Agent Capture projection</p>
          <h2>${escapeHtml(request.title)}</h2>
          <p>${escapeHtml(request.body ?? "")}</p>
        </div>
        <dl class="capture-metrics">
          <div><dt>target</dt><dd>${escapeHtml(plan.target.kind)}</dd></div>
          <div><dt>memory</dt><dd>${escapeHtml(request.memoryPolicy ?? "none")}</dd></div>
          <div><dt>warnings</dt><dd>${plan.warnings.length}</dd></div>
        </dl>
      </header>
      <div class="capture-layout">
        <div class="capture-main">
          <section class="capture-preview">
            <div class="capture-section-heading">
              <span>Native Org entry</span>
              <strong>${plan.requiresConfirmation ? "confirmation required" : "ready"}</strong>
            </div>
            <pre><code>${escapeHtml(plan.orgEntry)}</code></pre>
          </section>
          ${renderPatchPreview(applyPreview)}
        </div>
        <aside class="capture-inspector">
          ${renderApplication(response, applyPreview)}
          ${renderTarget(response)}
          ${renderReceipts(response)}
          ${renderWarnings(response)}
        </aside>
      </div>
    </section>
  `;
};

const renderApplication = (
  response: OrgizeAgentCapturePlanResponseDto,
  applyPreview: NonNullable<OrgizeDocumentView["captureApplyPreview"]>,
): string => {
  const application = response.plan.application;
  return `
    <section class="capture-panel">
      <h3>Application</h3>
      <dl class="capture-kv">
        <div><dt>action</dt><dd>${escapeHtml(application.action)}</dd></div>
        <div><dt>status</dt><dd>${escapeHtml(applyPreview.status)}</dd></div>
        <div><dt>lock</dt><dd>${escapeHtml(applyPreview.lock)}</dd></div>
      </dl>
      <ol class="capture-list">
        ${applyPreview.preconditions
          .map(
            (precondition) => `
              <li>
                <strong>${escapeHtml(precondition.kind)}</strong>
                <em>${escapeHtml(precondition.owner)}</em>
                <span>${escapeHtml(precondition.message)}</span>
              </li>
            `,
          )
          .join("")}
      </ol>
    </section>
  `;
};

const renderPatchPreview = (
  applyPreview: NonNullable<OrgizeDocumentView["captureApplyPreview"]>,
): string => `
  <section class="capture-preview capture-preview--patch">
    <div class="capture-section-heading">
      <span>Runtime patch preview</span>
      <strong>${escapeHtml(applyPreview.sourceFile)}</strong>
    </div>
    <p>${escapeHtml(applyPreview.note)}</p>
    <pre><code>${escapeHtml(applyPreview.patchPreview)}</code></pre>
  </section>
`;

const renderTarget = (response: OrgizeAgentCapturePlanResponseDto): string => {
  const target = response.plan.target;
  return `
    <section class="capture-panel">
      <h3>Target</h3>
      <dl class="capture-kv">
        <div><dt>file</dt><dd>${escapeHtml(target.sourceFile ?? "runtime")}</dd></div>
        <div><dt>path</dt><dd>${escapeHtml(target.outlinePath.join(" / ") || target.kind)}</dd></div>
        <div><dt>date</dt><dd>${escapeHtml(formatDate(target.date))}</dd></div>
        <div><dt>insert</dt><dd>${escapeHtml(target.insertPosition)}</dd></div>
      </dl>
    </section>
  `;
};

const renderReceipts = (response: OrgizeAgentCapturePlanResponseDto): string => `
  <section class="capture-panel">
    <h3>Receipts</h3>
    <ol class="capture-list">
      ${response.plan.receipts
        .map(
          (receipt) => `
            <li>
              <strong>${escapeHtml(receipt.kind)}</strong>
              <span>${escapeHtml(receipt.message)}</span>
            </li>
          `,
        )
        .join("")}
    </ol>
  </section>
`;

const renderWarnings = (response: OrgizeAgentCapturePlanResponseDto): string => {
  if (response.plan.warnings.length === 0) {
    return `
      <section class="capture-panel capture-panel--quiet">
        <h3>Warnings</h3>
        <p>No warnings.</p>
      </section>
    `;
  }
  return `
    <section class="capture-panel capture-panel--warning">
      <h3>Warnings</h3>
      <ol class="capture-list">
        ${response.plan.warnings
          .map(
            (warning) => `
              <li>
                <strong>${escapeHtml(warning.kind)}</strong>
                <span>${escapeHtml(warning.message)}</span>
              </li>
            `,
          )
          .join("")}
      </ol>
    </section>
  `;
};

const formatDate = (date: OrgizeAgentCapturePlanResponseDto["plan"]["target"]["date"]): string => {
  if (!date) {
    return "none";
  }
  return `${date.year}-${pad2(date.month)}-${pad2(date.day)}`;
};

const pad2 = (value: number): string => String(value).padStart(2, "0");

const escapeHtml = (value: string | number): string =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
