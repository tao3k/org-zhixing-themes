import { publicAssetUrl } from "./config";
import {
  attachmentDisplayRecords,
  type AttachmentDisplayRecord,
  type OrgizeDocumentView,
} from "./model";

export const renderAttachmentGallery = (
  document: OrgizeDocumentView,
  sourceFile: string | undefined,
): string => {
  const inventory = document.attachmentInventory;
  if (!inventory) {
    return `<div class="empty">Loading attachment gallery...</div>`;
  }
  const records = attachmentDisplayRecords(document);
  if (records.length === 0) {
    return `
      <section class="attachment-gallery" aria-label="Attachment gallery">
        ${renderAttachmentGalleryHeader(0, 0, inventory.entries.length)}
        <div class="empty">No attachment-backed media found in this Org source.</div>
      </section>
    `;
  }
  const imageCount = records.filter((record) => record.mediaKind === "image").length;
  return `
    <section class="attachment-gallery" aria-label="Attachment gallery">
      ${renderAttachmentGalleryHeader(records.length, imageCount, inventory.entries.length)}
      <div class="attachment-grid">
        ${records.map((record) => renderAttachmentCard(record, sourceFile)).join("")}
      </div>
    </section>
  `;
};

const renderAttachmentGalleryHeader = (
  displayCount: number,
  imageCount: number,
  entryCount: number,
): string => `
  <header class="attachment-gallery-header">
    <div>
      <p class="eyebrow">Org attachments</p>
      <h2>Wallpaper gallery</h2>
      <p>${escapeHtml(
        `${displayCount} display items from ${entryCount} semantic attachment records; ${imageCount} are image media.`,
      )}</p>
    </div>
    <dl class="attachment-metrics" aria-label="Attachment gallery metrics">
      <div><dt>Display</dt><dd>${displayCount}</dd></div>
      <div><dt>Images</dt><dd>${imageCount}</dd></div>
      <div><dt>Sources</dt><dd>${entryCount}</dd></div>
    </dl>
  </header>
`;

const renderAttachmentCard = (
  record: AttachmentDisplayRecord,
  sourceFile: string | undefined,
): string => {
  const title = record.sectionTitle || attachmentBasename(record.linkPath);
  const url = attachmentPublicUrl(record, sourceFile);
  const tags = [...new Set(record.effectiveTags)].slice(0, 5);
  return `
    <article class="attachment-card">
      <a href="${escapeHtml(url)}" target="_blank" rel="noreferrer">
        ${renderAttachmentMedia(record, url, title)}
        <div class="attachment-card-body">
          <span>${escapeHtml(record.mediaKind)}</span>
          <h3>${escapeHtml(title)}</h3>
          <p>${escapeHtml(record.outlinePath.join(" / ") || record.directoryPath)}</p>
          <div class="meta-row">
            ${tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}
          </div>
        </div>
      </a>
    </article>
  `;
};

const renderAttachmentMedia = (
  record: AttachmentDisplayRecord,
  url: string,
  title: string,
): string =>
  record.mediaKind === "image"
    ? `<img src="${escapeHtml(url)}" alt="${escapeHtml(title)}" loading="lazy" decoding="async">`
    : `<div class="attachment-file-preview">${escapeHtml(record.mediaKind.toUpperCase())}</div>`;

const attachmentPublicUrl = (
  record: AttachmentDisplayRecord,
  sourceFile: string | undefined,
): string => publicAssetUrl(attachmentPublicPath(record, sourceFile)).toString();

const attachmentPublicPath = (
  record: AttachmentDisplayRecord,
  sourceFile: string | undefined,
): string => {
  const directoryPath = normalizePublicPath(record.directoryPath);
  const linkPath = normalizePublicPath(record.linkPath);
  const joined = joinPath(directoryPath, linkPath);
  const sourceRoot = sourceFile ? normalizePublicPath(sourceFile).split("/")[0] : "";
  if (!sourceFile || (sourceRoot && directoryPath.startsWith(`${sourceRoot}/`))) {
    return joined;
  }
  return joinPath(dirname(sourceFile), joined);
};

const normalizePublicPath = (value: string): string =>
  value
    .replace(/^.*\/public\//, "")
    .replace(/^\.?\//, "")
    .replace(/^\/+/, "");

const dirname = (path: string): string => {
  const normalized = normalizePublicPath(path);
  const slash = normalized.lastIndexOf("/");
  return slash === -1 ? "" : normalized.slice(0, slash);
};

const joinPath = (...parts: string[]): string =>
  parts
    .map((part) => part.replace(/^\/+|\/+$/g, ""))
    .filter(Boolean)
    .join("/");

const attachmentBasename = (path: string): string => {
  const normalized = normalizePublicPath(path);
  return normalized.split("/").filter(Boolean).at(-1) ?? "Attachment";
};

const escapeHtml = (value: string | number): string =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
