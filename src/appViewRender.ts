import type { OrgizeLintFindingDto } from "orgize/dto";
import type { AgendaPanelKey } from "./agendaTypes";
import { renderAgenda } from "./agendaRender";
import { renderBlogReader } from "./blogRender";
import { renderAgentCapture } from "./captureRender";
import type { AgendaModeKey } from "./config";
import { renderAgentMemory } from "./memoryRender";
import { noteRecords, type OrgizeDocumentView, type ViewKey } from "./model";
import { renderOrgRecordCards, renderSiteOrgRecordCards } from "./recordRender";
import type { SiteNoteSource } from "./siteNotes";
import type { StaticBlogIndex } from "./staticSiteData";
import { renderTravel } from "./travelRender";
import type { TravelView } from "./travelModel";

type AppViewKey = Exclude<ViewKey, "gallery">;

export type RenderAppViewOptions = {
  view: AppViewKey;
  document: OrgizeDocumentView | null;
  pendingMessage?: string;
  agendaMode?: AgendaModeKey;
  agendaPanel?: AgendaPanelKey;
  agendaRuleId?: string | null;
  articleHtml?: string;
  articleMessage?: string;
  blogArticleRangeStart?: number | null;
  blogIndex?: StaticBlogIndex | null;
  blogTagFilter?: string | null;
  blogTimeFilter?: string | null;
  blogZenMode?: boolean;
  siteNotes?: SiteNoteSource[] | null;
  travelView?: TravelView;
  sourceFile?: string;
};

export const renderAppView = (options: RenderAppViewOptions): string => {
  const siteWideHtml = renderSiteWideView(options);
  if (siteWideHtml !== null) return siteWideHtml;
  if (options.pendingMessage)
    return `<div class="empty">${escapeHtml(options.pendingMessage)}</div>`;
  if (!options.document) return "";
  return renderLoadedView({ ...options, document: options.document });
};

const renderSiteWideView = (options: RenderAppViewOptions): string | null => {
  if (options.view === "blog" && options.blogIndex && !options.blogZenMode) {
    return renderBlogReader({
      document: options.document,
      articleHtml: options.articleHtml ?? "",
      articleMessage: options.articleMessage ?? "",
      blogIndex: options.blogIndex,
      selectedRangeStart: options.blogArticleRangeStart ?? null,
      tagFilter: options.blogTagFilter ?? null,
      timeFilter: options.blogTimeFilter ?? null,
      zenMode: false,
      sourceFile: options.sourceFile,
    });
  }
  if (options.view === "travel" && options.travelView) {
    return renderTravel(
      options.document,
      options.sourceFile,
      options.travelView,
      options.articleHtml,
    );
  }
  if (options.view === "records" && options.siteNotes !== undefined) {
    return options.siteNotes
      ? renderSiteOrgRecordCards(options.siteNotes)
      : `<div class="empty">Loading static notes...</div>`;
  }
  return null;
};

const renderLoadedView = ({
  view,
  document,
  agendaMode = "classic",
  agendaPanel = "trace",
  agendaRuleId = null,
  articleHtml = "",
  articleMessage = "",
  blogArticleRangeStart = null,
  blogIndex,
  blogTagFilter = null,
  blogTimeFilter = null,
  blogZenMode = false,
  siteNotes,
  travelView,
  sourceFile,
}: RenderAppViewOptions & { document: OrgizeDocumentView }): string => {
  switch (view) {
    case "blog":
      return renderBlogReader({
        document,
        articleHtml,
        articleMessage,
        blogIndex,
        selectedRangeStart: blogArticleRangeStart,
        tagFilter: blogTagFilter,
        timeFilter: blogTimeFilter,
        zenMode: blogZenMode,
        sourceFile,
      });
    case "records":
      return siteNotes
        ? renderSiteOrgRecordCards(siteNotes)
        : renderOrgRecordCards(noteRecords(document), "Notes", {
            articleHtml,
            document,
            sourceFile,
          });
    case "memory":
      return renderAgentMemory(document.agentMemory, { articleHtml, document, sourceFile });
    case "travel":
      return renderTravel(document, sourceFile, travelView, articleHtml);
    case "agenda":
      return renderAgenda(document, agendaMode, agendaPanel, agendaRuleId);
    case "capture":
      return renderAgentCapture(document);
    case "diagnostics":
      return document.lint
        ? renderDiagnostics(document.lint)
        : `<div class="empty">Loading lint...</div>`;
  }
};

const renderDiagnostics = (findings: OrgizeLintFindingDto[]): string =>
  findings.length === 0
    ? `<div class="empty">No lint findings.</div>`
    : `<ol class="diagnostics">${findings
        .map(
          (finding) =>
            `<li><strong>${escapeHtml(finding.code)}</strong><span>${escapeHtml(finding.severity)}</span><p>${escapeHtml(finding.message)}</p></li>`,
        )
        .join("")}</ol>`;

const escapeHtml = (value: string | number): string =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
