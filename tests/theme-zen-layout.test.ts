import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string): string => readFileSync(path, "utf8");

describe("theme-owned Zen layouts", () => {
  it("exposes a stable reader-layout slot to every bundled theme", () => {
    for (const path of [
      "themes/documents/src/index.ts",
      "themes/elegant-blog/src/foundation.ts",
      "themes/minimal-notes/src/index.ts",
    ]) {
      const theme = read(path);
      expect(theme).toContain('id: "reader-layout"');
      expect(theme).toContain('"reader-layout":');
    }
  });

  it("keeps Zen width and composition in theme CSS, not the shared foundation", () => {
    const foundation = read("src/styles/foundation.css");
    expect(foundation).not.toContain('#app[data-reader-mode="zen"] .viewer-pane');

    expect(read("themes/documents/src/theme.css")).toContain(
      ".theme-surface--documents.shell--zen .documents-reader",
    );
    expect(read("themes/elegant-blog/src/theme.css")).toContain(
      '.elegant-blog-reader-layout[data-reader-mode="zen"]',
    );
    expect(read("themes/minimal-notes/src/theme.css")).toContain(
      '.minimal-notes-reader-layout[data-reader-mode="zen"]',
    );
  });

  it("keeps the Org context map outside optional theme wrappers", () => {
    const shell = read("src/react/ShellChrome.tsx");
    const mapStyle = read("src/styles/org-world-tree.css");

    expect(shell).toContain("const OrgWorldTreePanel = lazy(() =>");
    expect(shell).toContain('import("./OrgWorldTreePanel")');
    expect(shell).toContain('readerMode === "zen" ? (');
    expect(shell).toContain("<Suspense fallback={null}>");
    expect(shell).toContain("<OrgWorldTreePanel staticSite={shell.staticSite} />");
    expect(shell).not.toContain('"zen-utility"');
    expect(shell).not.toContain('className="zen-mode-exit"');
    expect(shell).not.toContain("Exit Zen");
    expect(mapStyle).toContain("top: 6vh;");
    expect(mapStyle).toContain("right: 10vw;");
    expect(mapStyle).toContain("bottom: 6vh;");
    expect(mapStyle).toContain("left: 10vw;");
    expect(mapStyle).toContain("var(--face-salient)");
    expect(mapStyle).toContain(".org-world-tree-knowledge-graph");
    expect(mapStyle).toContain("top: 50%;");
    expect(mapStyle).toContain("translateY(-50%)");
    expect(read("src/react/OrgWorldTreePanel.tsx")).toContain("<OrgKnowledgeGraph");
    expect(mapStyle).not.toContain("documents-zen-utility");
  });

  it("opens the world tree only from its trigger and focuses the active branch", () => {
    const panel = read("src/react/OrgWorldTreePanel.tsx");
    const mapStyle = read("src/styles/org-world-tree.css");

    expect(panel).toContain("onPointerEnter={scheduleOpen}");
    expect(panel).toContain("setTimeout(openMap, 120)");
    expect(panel).toContain("onPointerEnter={retainOpen}");
    expect(panel).toContain("const [pinned, setPinned]");
    expect(panel).toContain("onClick={pinMap}");
    expect(panel).not.toContain("onPointerEnter={openMap}");
    expect(panel).not.toContain("onFocus={openMap}");
    expect(panel).toContain("<OrgKnowledgeGraph");
    expect(panel).toContain("tree.worldSources");
    expect(panel).toContain("? [...tree.worldSources, ...globalHeadings]");
    expect(panel).toContain("loadStaticKnowledgeGraph");
    expect(panel).toContain("type KnowledgeGraphScenario");
    expect(panel).toContain('aria-label="Knowledge graph"');
    expect(panel).toContain('aria-label="Mind map"');
    expect(panel).toContain("projectOrgKnowledgeGraph");
    expect(panel).not.toContain("<ReactFlow");
    const graph = read("src/react/OrgKnowledgeGraph.tsx");
    expect(graph).toContain('import Graph from "graphology"');
    expect(graph).toContain('import("sigma")');
    expect(graph).not.toContain('import("graphology-layout-forceatlas2/worker")');
    expect(graph).toContain('import("@sigma/node-border")');
    expect(graph).not.toContain('import("@sigma/edge-curve")');
    expect(graph).toContain('type: "line"');
    expect(graph).toContain("createNodeBorderProgram");
    expect(graph).toContain("drawCommunityFields");
    expect(graph).toContain("drawFocusTrails");
    expect(graph).toContain("trimTrail");
    expect(graph).toContain('hidden: scenario === "mindmap"');
    expect(graph).toContain('import { formatRgb, parse } from "culori"');
    expect(graph).toContain('typeof WebGL2RenderingContext === "undefined"');
    expect(graph).toContain("new ResizeObserver(updateReadiness)");
    expect(graph).toContain("rect.width < 2 || rect.height < 2");
    expect(graph).not.toContain("allowInvalidContainer");
    expect(graph).toContain('import { gsap } from "gsap"');
    expect(graph).toContain("nodeReducer");
    expect(graph).toContain("...data");
    expect(graph).toContain("motionTween");
    expect(graph).toContain("graph.getNodeAttributes(activeNodeId)");
    expect(graph).toContain("event.deltaY");
    expect(graph).toContain("const sameSource =");
    expect(graph).toContain("focusDepths.get(node)");
    expect(graph).toContain("expandedLabels");
    expect(graph).toContain("shouldExpandKnowledgeGraphLabels(scope, ratio)");
    expect(graph).toContain("initialKnowledgeGraphCameraRatio(scope)");
    expect(graph).toContain("renderer.viewportToFramedGraph(");
    expect(graph).toContain("renderer.graphToViewport({ x: active.x, y: active.y })");
    expect(graph).not.toContain("graphFocalReceipt");
    expect(graph).toContain("org-world-tree-community-layer");
    expect(graph).toContain("org-world-tree-network-layer");
    expect(graph).toContain("knowledgeCommunityOutlines(graph)");
    expect(graph).toContain("drawCommunityFields(layer.context, communityOutlines");
    expect(graph).toContain('renderer.getCamera().on("updated", ({ ratio }) =>');
    expect(graph).toContain("scheduleCameraSettled(ratio)");
    expect(graph).toContain("pendingWheelDelta += event.deltaY");
    expect(graph).toContain("knowledgeGraphWheelSettleDelayMs");
    expect(mapStyle).toContain('[data-camera-moving="true"]');
    expect(graph).toContain("prepareGraphLayer");
    expect(graph).toContain("graph.edges(highlightedNodeId)");
    expect(graph).not.toContain("renderer.scheduleRefresh()");
    expect(graph).toContain("drawKnowledgeCommunities");
    expect(graph).toContain("hideEdgesOnMove: false");
    expect(graph).toContain("semanticNeighborhoodDepths(graph, nodeId, scenario, 2)");
    expect(graph).toContain("pointOnQuadraticRelation");
    expect(graph).toContain("drawRelationArrow");
    expect(graph).toContain("mountController.abort()");
    expect(graph).toContain("drawMindMapBranches");
    expect(graph).toContain('scenario === "graph"');
    expect(graph).toContain('attributes.kind !== "outline"');
    expect(graph).toContain('const explicitLink = attributes.kind === "link"');
    expect(graph).toContain("focusedSourceFile");
    expect(graph).toContain("nodeProgramClasses: { border: KnowledgeNodeProgram }");
    expect(graph).not.toContain("edgeProgramClasses");
    expect(graph).toContain("labelColor: { color: palette.label }");
    expect(graph).toContain('itemSizesReference: "screen"');
    expect(graph).toContain('renderer.on("enterNode"');
    expect(graph).toContain('renderer.on("clickNode"');
    expect(graph).toContain("knowledgeGraphRelationKindsForScenario(scenario)");
    expect(graph).toContain("KnowledgeGraphRelation");
    expect(panel).toContain("placeDescendants(active.id, 1, -0.54, 1.52)");
    expect(panel).toContain("Math.cos(childBearing) * radius");
    expect(panel).toContain("placePeripheralBranch");
    expect(panel).toContain("resolveWorldTreeNavigationTarget(navigationNodes, node)");
    expect(panel).toContain('to: "/blogs/$articleId"');
    expect(panel).toContain("articleId: String(target.articleRangeStart)");
    expect(panel).toContain("focus: target.focusRangeStart");
    expect(panel).toContain("revealRequestedHeading");
    expect(panel).toContain("find((node) => node.rangeStart !== null)");
  });

  it("passes the current source identity through theme-owned document readers", () => {
    const reader = read("themes/documents/src/DocumentsReader.tsx");

    expect(reader).toContain("sourceFile={data.source.sourceFile}");
  });
});
