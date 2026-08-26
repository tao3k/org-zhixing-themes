import { attachmentPublicUrl, basename } from "./attachmentPaths";
import { attachmentDisplayRecords, type OrgizeDocumentView } from "./model";

export const rewriteAttachmentLinks = (
  root: ParentNode,
  document: OrgizeDocumentView,
  sourceFile: string | undefined,
): void => {
  const attachmentUrls = attachmentUrlMap(document, sourceFile);
  if (attachmentUrls.size === 0) {
    return;
  }
  for (const element of root.querySelectorAll<HTMLAnchorElement | HTMLImageElement>(
    "a[href^='attachment:'],img[src^='attachment:']",
  )) {
    const attribute = element instanceof HTMLImageElement ? "src" : "href";
    const raw = element.getAttribute(attribute);
    const key = attachmentKey(raw);
    const rewritten = key ? attachmentUrls.get(key) : undefined;
    if (!rewritten) {
      continue;
    }
    element.setAttribute(attribute, rewritten);
    if (element instanceof HTMLImageElement) {
      element.classList.add("org-attachment-image");
    }
    if (element instanceof HTMLAnchorElement) {
      element.target = "_blank";
      element.rel = "noreferrer";
    }
  }
};

const attachmentUrlMap = (
  document: OrgizeDocumentView,
  sourceFile: string | undefined,
): Map<string, string> => {
  const urls = new Map<string, string>();
  for (const record of attachmentDisplayRecords(document)) {
    const key = basename(record.linkPath);
    if (!key || urls.has(key)) {
      continue;
    }
    urls.set(key, attachmentPublicUrl(record, sourceFile));
  }
  return urls;
};

const attachmentKey = (value: string | null): string | null => {
  if (!value?.startsWith("attachment:")) {
    return null;
  }
  const [path] = value.slice("attachment:".length).split("::", 1);
  try {
    return basename(decodeURIComponent(path));
  } catch {
    return basename(path);
  }
};
