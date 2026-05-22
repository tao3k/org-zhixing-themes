import { blogArticles, type OrgizeDocumentView, type ViewKey } from "./model";

export const renderLifeIndex = (document: OrgizeDocumentView): string => `
  <nav class="life-index" aria-label="Life archive index">
    ${renderLifeFacet("Writing", "blog", `${blogArticles(document).length}`)}
    ${renderLifeFacet("Images", "gallery", `${document.counts.attachments}`)}
    ${renderLifeFacet("Notes", "records", `${document.counts.records}`)}
    ${renderLifeFacet("Journeys", "travel", "Travel")}
    ${renderLifeFacet("Memory", "memory", `${document.counts.memory}`)}
    ${renderLifeFacet("Time", "agenda", `${document.counts.agenda}`)}
  </nav>
`;

const renderLifeFacet = (label: string, view: ViewKey, value: string): string => `
  <button type="button" class="life-index-item" data-view="${view}">
    <span>${escapeHtml(label)}</span>
    <strong>${escapeHtml(value)}</strong>
  </button>
`;

const escapeHtml = (value: string | number): string =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
