import { resolveOrgLinkHref } from "../orgIdLinks.ts";

export const projectOrgDocumentLinks = (html, { currentFile, document, sources }) => {
  const parsed = document.implementation.createHTMLDocument("");
  parsed.body.innerHTML = html;
  for (const link of parsed.body.querySelectorAll("a[href]")) {
    const href = link.getAttribute("href");
    const projected = href ? resolveOrgLinkHref(href, { currentFile, documents: sources }) : null;
    if (projected) link.setAttribute("href", projected);
  }
  return parsed.body.innerHTML;
};
