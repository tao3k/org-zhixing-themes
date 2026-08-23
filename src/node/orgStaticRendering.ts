import { Window } from "happy-dom";

import {
  renderOrgStaticMermaidDocument,
  type StaticMermaidRenderer,
} from "./orgStaticMermaidRendering";
import { highlightOrgStaticDocument } from "./orgStaticCodeHighlighting";
import { renderOrgStaticTypstDocument, type StaticTypstRenderer } from "./orgStaticTypstRendering";
import { resolveOrgLinkHref } from "../orgIdLinks";

type OrgSource = { file: string; id: string };

export type OrgStaticRenderOptions = {
  currentFile: string;
  mermaidRenderer?: StaticMermaidRenderer;
  sources: OrgSource[];
  typstRenderer?: StaticTypstRenderer;
};

const projectDocumentLinks = (
  document: Document,
  currentFile: string,
  sources: OrgSource[],
): void => {
  for (const link of document.body.querySelectorAll("a[href]")) {
    const href = link.getAttribute("href");
    const projected = href ? resolveOrgLinkHref(href, { currentFile, documents: sources }) : null;
    if (projected) link.setAttribute("href", projected);
  }
};

/** Runs every build-time enhancement against one DOM rather than serial HTML strings. */
export const renderOrgStaticHtml = async (
  html: string,
  { currentFile, sources, mermaidRenderer, typstRenderer }: OrgStaticRenderOptions,
): Promise<string> => {
  const window = new Window();
  const document = window.document as unknown as Document;
  document.body.innerHTML = html;

  projectDocumentLinks(document, currentFile, sources);
  await highlightOrgStaticDocument(document);
  await renderOrgStaticTypstDocument(document, typstRenderer);
  await renderOrgStaticMermaidDocument(document, mermaidRenderer);

  return document.body.innerHTML;
};
