import { installMermaidDiagrams } from "./mermaidDiagrams";
import { installOrgCodeHighlighting } from "./orgCodeHighlighting";
import { installOrgMathRendering } from "./orgMathRendering";
import { installOrgPooFlowRendering } from "./orgPooFlowRendering";
import { installOrgTypstRendering } from "./orgTypstRendering";

export const installOrgContentEnhancements = (root: HTMLElement): (() => void) => {
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
