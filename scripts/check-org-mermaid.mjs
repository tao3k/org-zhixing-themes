import { Window } from "happy-dom";

import {
  formatOrgMermaidDiagnostic,
  validateOrgMermaidRoots,
} from "../src/node/orgMermaidValidation.ts";

const args = process.argv.slice(2);
const json = args.includes("--json");
const roots = args.filter((argument) => argument !== "--json");
const selectedRoots = roots.length > 0 ? roots : ["docs"];

const htmlWindow = new Window();
Object.assign(globalThis, {
  document: htmlWindow.document,
  Element: htmlWindow.Element,
  HTMLElement: htmlWindow.HTMLElement,
  SVGElement: htmlWindow.SVGElement,
  window: htmlWindow,
});
const { default: mermaid } = await import("mermaid");

mermaid.initialize({
  startOnLoad: false,
  securityLevel: "strict",
  suppressErrorRendering: true,
});

const result = await validateOrgMermaidRoots(selectedRoots, (source) => mermaid.parse(source));
if (json) {
  console.log(JSON.stringify({ roots: selectedRoots, ...result }, null, 2));
} else if (result.diagnostics.length > 0) {
  for (const diagnostic of result.diagnostics) {
    console.error(formatOrgMermaidDiagnostic(diagnostic));
  }
  console.error(
    `org-mermaid invalid=${result.diagnostics.length} blocks=${result.blocks} files=${result.files}`,
  );
} else {
  console.log(`org-mermaid ok blocks=${result.blocks} files=${result.files}`);
}

if (result.diagnostics.length > 0) process.exitCode = 1;
