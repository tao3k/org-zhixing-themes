import { resolveOrgLinkHref } from "../orgIdLinks.ts";

export const projectOrgDocumentLinksInDocument = (document, { currentFile, sources }) => {
  for (const link of document.body.querySelectorAll("a[href]")) {
    const href = link.getAttribute("href");
    const projected = href ? resolveOrgLinkHref(href, { currentFile, documents: sources }) : null;
    if (projected) link.setAttribute("href", projected);
  }
};

export const projectOrgDocumentLinks = (html, { currentFile, document, sources }) => {
  const parsed = document.implementation.createHTMLDocument("");
  parsed.body.innerHTML = html;
  projectOrgDocumentLinksInDocument(parsed, { currentFile, sources });
  return parsed.body.innerHTML;
};
