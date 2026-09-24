import { renderOrgStaticHtml } from "../src/node/orgStaticRendering.ts";
import { closeOrgStaticMermaidRenderer } from "../src/node/orgStaticMermaidRendering.ts";
import { closeOrgStaticTypstRenderer } from "../src/node/orgStaticTypstRendering.ts";

process.on("message", async (request) => {
  if (request?.shutdown) {
    await Promise.all([closeOrgStaticMermaidRenderer(), closeOrgStaticTypstRenderer()]);
    process.disconnect();
    return;
  }
  try {
    const html = await renderOrgStaticHtml(request.html, {
      currentFile: request.currentFile,
      sources: request.sources,
    });
    process.send({
      id: request.id,
      html,
      renderUnits: staticMediaRenderUnits(request.html),
      rssBytes: process.memoryUsage().rss,
    });
  } catch (error) {
    process.send({
      id: request?.id,
      error: error instanceof Error ? (error.stack ?? error.message) : String(error),
    });
  }
});

const staticMediaRenderUnits = (html) => {
  const mermaid = html.match(/<pre\b[^>]*\b(?:src-mermaid|language-mermaid)\b/gu)?.length ?? 0;
  const typst = html.match(/<pre\b[^>]*\b(?:src-typst|src-typ|language-typst)\b/gu)?.length ?? 0;
  return mermaid * 4 + typst;
};
