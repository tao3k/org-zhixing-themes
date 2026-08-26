import { installMermaidDiagrams } from "./mermaidDiagrams";
import { installOrgCodeHighlighting } from "./orgCodeHighlighting";
import { installOrgMathRendering } from "./orgMathRendering";
import { installOrgPooFlowRendering } from "./orgPooFlowRendering";
import { installOrgTypstRendering } from "./orgTypstRendering";
import { rewriteAttachmentLinks } from "../attachmentHtmlRewrite";
import type { OrgizeDocumentView } from "../model";
import { augmentOrgHtmlMetadata } from "../orgHtmlMetadata";
import { enhanceOrgNativeAesthetics } from "../orgNativeAesthetics";

export const applyOrgSemanticEnhancements = (
  root: HTMLElement,
  documentView: OrgizeDocumentView,
  sourceFile?: string,
): void => {
  rewriteAttachmentLinks(root, documentView, sourceFile);
  augmentOrgHtmlMetadata(root, documentView);
  enhanceOrgNativeAesthetics(root, documentView);
};

export const installOrgContentEnhancements = (
  root: HTMLElement,
  documentView?: OrgizeDocumentView,
  sourceFile?: string,
): (() => void) => {
  if (documentView) {
    applyOrgSemanticEnhancements(root, documentView, sourceFile);
  }
  const stop = [
    installMermaidDiagrams(root),
    installOrgTypstRendering(root),
    installOrgPooFlowRendering(root),
    installOrgCodeHighlighting(root),
    installOrgMathRendering(root),
  ];
  return () => {
    for (const dispose of [...stop].reverse()) dispose();
  };
};
