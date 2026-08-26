import { describe, expect, it } from "vitest";
import { createDocumentView } from "../src/model";
import {
  contextualOrgWorldTreeNodes,
  globalHeadingNodesForSource,
  globalOrgLinkRelations,
  orgWorldTreeFromDocument,
  orgWorldTreeFromSite,
  resolveWorldTreeNavigationTarget,
  sourceIdForWorldTreeSourceFile,
  worldTreeNodeIdForRangeStart,
} from "../src/react/orgWorldTree";
import { projectOrgKnowledgeGraph, semanticFacetsFor } from "../src/react/OrgWorldTreePanel";
import { orgWorldTerrainAnchors } from "../src/react/OrgWorldTerrain";
import {
  initialKnowledgeGraphCameraRatio,
  knowledgeGraphCameraSettleDelayMs,
  knowledgeGraphRelationKindsForScenario,
  knowledgeGraphWheelSettleDelayMs,
  nextKnowledgeGraphScope,
  pointOnQuadraticRelation,
  shouldExpandKnowledgeGraphLabels,
} from "../src/react/OrgKnowledgeGraph";

const section = (rangeStart: number, level: number, title: string, tags: string[] = []) =>
  ({
    rangeStart,
    level,
    title,
    todo: null,
    todoState: null,
    effectiveTags: tags,
    planning: { closed: null, deadline: null, scheduled: null },
    properties: [],
    body: [],
  }) as never;

describe("Org world tree", () => {
  it("projects Org outline nesting into stable navigable nodes", () => {
    const document = createDocumentView([
      section(10, 1, "Root", ["memory"]),
      section(20, 2, "Child", ["research"]),
      section(30, 1, "Second root"),
    ]);

    expect(orgWorldTreeFromDocument(document)).toEqual({
      rootId: "org-root",
      worldClusters: [],
      worldSources: [],
      nodes: [
        expect.objectContaining({ id: "org-10", parentId: "org-root", rangeStart: 10 }),
        expect.objectContaining({ id: "org-20", parentId: "org-10", rangeStart: 20 }),
        expect.objectContaining({ id: "org-30", parentId: "org-root", rangeStart: 30 }),
      ],
    });
  });

  it("uses source range starts as DOM-safe identity", () => {
    expect(worldTreeNodeIdForRangeStart(402)).toBe("org-402");
  });

  it("resolves a world-map source to the canonical router document id", () => {
    const sources = [
      { id: "org-zen-essay", sourceFile: "blog/org-zen-essay.org" },
      { id: "travel", sourceFile: "blog/travel.org" },
    ] as never;

    expect(sourceIdForWorldTreeSourceFile(sources, "blog/travel.org")).toBe("travel");
    expect(sourceIdForWorldTreeSourceFile(sources, "blog/missing.org")).toBeNull();
  });

  it("resolves graph landmarks, headings, and semantic facets to article routes", () => {
    const nodes = [
      {
        id: "source-research",
        kind: "source" as const,
        label: "Research",
        level: 1,
        parentId: "org-root",
        rangeStart: null,
        sourceFile: "blog/research.org",
        tags: [],
        todo: null,
      },
      {
        id: "source-research/heading-10",
        kind: "section" as const,
        label: "Article",
        level: 2,
        parentId: "source-research",
        rangeStart: 10,
        sourceFile: "blog/research.org",
        tags: [],
        todo: null,
      },
      {
        id: "source-research/heading-20",
        kind: "section" as const,
        label: "Evidence",
        level: 3,
        parentId: "source-research/heading-10",
        rangeStart: 20,
        sourceFile: "blog/research.org",
        tags: [],
        todo: "NEXT",
      },
    ];

    expect(resolveWorldTreeNavigationTarget(nodes, nodes[0]!)).toEqual({
      articleRangeStart: 10,
      focusRangeStart: 10,
      sourceFile: "blog/research.org",
    });
    expect(resolveWorldTreeNavigationTarget(nodes, nodes[2]!)).toEqual({
      articleRangeStart: 10,
      focusRangeStart: 20,
      sourceFile: "blog/research.org",
    });
    expect(
      resolveWorldTreeNavigationTarget(nodes, {
        id: "source-research/heading-20/facet/tag/graph",
        parentId: "source-research/heading-20",
        rangeStart: null,
        sourceFile: "blog/research.org",
      }),
    ).toEqual({
      articleRangeStart: 10,
      focusRangeStart: 20,
      sourceFile: "blog/research.org",
    });
  });

  it("preserves every parser-owned heading instead of truncating a large Org source", () => {
    const document = createDocumentView(
      Array.from({ length: 512 }, (_, index) => section(index * 10, 1, `Heading ${index}`)),
    );

    expect(orgWorldTreeFromDocument(document).nodes).toHaveLength(512);
  });

  it("starts from the active branch without crowding it with sibling headings", () => {
    const tree = orgWorldTreeFromDocument(
      createDocumentView([
        section(10, 1, "Root"),
        section(20, 2, "Current"),
        section(30, 3, "Child"),
        section(40, 2, "Sibling"),
        section(50, 1, "Elsewhere"),
      ]),
    );

    expect(contextualOrgWorldTreeNodes(tree, 20, 1).map((node) => node.rangeStart)).toEqual([
      10, 20, 30,
    ]);
  });

  it("keeps every indexed Org source on the world map while expanding the focused source", () => {
    const document = createDocumentView([
      section(10, 1, "Current source root"),
      section(20, 2, "Current detail"),
    ]);
    const site = {
      sources: [
        {
          id: "current",
          name: "current.org",
          orgTitle: "Current source",
          file: "current.org",
          sourceFile: "blog/current.org",
          sourceBytes: 10,
        },
        {
          id: "elsewhere",
          name: "elsewhere.org",
          file: "elsewhere.org",
          sourceFile: "blog/elsewhere.org",
          sourceBytes: 10,
        },
      ],
    } as never;

    const tree = orgWorldTreeFromSite(document, site, "blog/current.org");

    expect(tree.nodes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "source-current", kind: "source" }),
        expect.objectContaining({
          id: "source-current/heading-10",
          parentId: "source-current",
          kind: "section",
        }),
      ]),
    );
    expect(tree.worldClusters).toEqual([{ id: "blog", label: "blog", count: 2 }]);
    expect(tree.worldSources).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "source-elsewhere" })]),
    );
    expect(tree.worldSources).toHaveLength(2);
    expect(tree.worldSources.every((source) => source.parentId === tree.rootId)).toBe(true);
  });

  it("projects corpus landmarks deterministically and emphasizes the active source", () => {
    const nodes = [
      { id: "source-one", kind: "source" as const, sourceFile: "blog/one.org" },
      { id: "source-two", kind: "source" as const, sourceFile: "blog/two.org" },
    ] as never;

    expect(orgWorldTerrainAnchors(nodes, "blog/two.org")).toEqual([
      expect.objectContaining({ id: "source-one", current: false }),
      expect.objectContaining({ id: "source-two", current: true }),
    ]);
    expect(orgWorldTerrainAnchors(nodes, "blog/two.org")).toEqual(
      orgWorldTerrainAnchors(nodes, "blog/two.org"),
    );
  });

  it("keeps a ten-thousand-file corpus at a constant-size focus projection", () => {
    const sources = Array.from({ length: 10_000 }, (_, index) => ({
      id: `source-${index}`,
      name: `note-${index}.org`,
      file: `note-${index}.org`,
      orgTitle: `Note ${index}`,
      sourceFile: `archive/note-${index}.org`,
      sourceBytes: 10,
    }));
    const tree = orgWorldTreeFromSite(
      createDocumentView([section(10, 1, "Focused note")]),
      { sources } as never,
      "archive/note-42.org",
    );

    expect(tree.nodes).toHaveLength(2);
    expect(tree.worldClusters).toEqual([{ id: "archive", label: "archive", count: 10_000 }]);
    expect(tree.worldSources).toHaveLength(10_000);
    expect(tree.worldSources.every((source) => source.kind === "source")).toBe(true);
  });

  it("moves through semantic graph scopes one layer per zoom gesture", () => {
    expect(nextKnowledgeGraphScope(1, 240)).toBe(2);
    expect(nextKnowledgeGraphScope(2, 240)).toBe(3);
    expect(nextKnowledgeGraphScope(3, 240)).toBe(3);
    expect(nextKnowledgeGraphScope(3, -240)).toBe(2);
    expect(nextKnowledgeGraphScope(1, -240)).toBe(1);
  });

  it("settles camera overlays before committing one semantic scope transition", () => {
    expect(knowledgeGraphCameraSettleDelayMs).toBeLessThan(knowledgeGraphWheelSettleDelayMs);
    expect(knowledgeGraphCameraSettleDelayMs).toBeGreaterThanOrEqual(80);
    expect(knowledgeGraphWheelSettleDelayMs).toBeLessThanOrEqual(160);
  });

  it("reveals every global heading label only after an intentional close zoom", () => {
    expect(shouldExpandKnowledgeGraphLabels(1, 0.2)).toBe(false);
    expect(shouldExpandKnowledgeGraphLabels(2, 0.2)).toBe(false);
    expect(shouldExpandKnowledgeGraphLabels(3, 0.19)).toBe(false);
    expect(shouldExpandKnowledgeGraphLabels(3, 0.18)).toBe(true);
  });

  it("opens each semantic scope at a focal camera scale instead of fitting the corpus", () => {
    expect(initialKnowledgeGraphCameraRatio(1)).toBe(0.84);
    expect(initialKnowledgeGraphCameraRatio(2)).toBe(0.56);
    expect(initialKnowledgeGraphCameraRatio(3)).toBe(0.3);
  });

  it("keeps both explicit links and outline containment visible in graph mode", () => {
    expect(knowledgeGraphRelationKindsForScenario("graph")).toEqual(["link", "outline"]);
    expect(knowledgeGraphRelationKindsForScenario("mindmap")).toEqual(["outline"]);
  });

  it("moves relation particles along a stable curved path", () => {
    const source = { x: 0, y: 0 };
    const control = { x: 50, y: 40 };
    const target = { x: 100, y: 0 };

    expect(pointOnQuadraticRelation(source, control, target, 0)).toEqual(source);
    expect(pointOnQuadraticRelation(source, control, target, 0.5)).toEqual({ x: 50, y: 20 });
    expect(pointOnQuadraticRelation(source, control, target, 1)).toEqual(target);
  });

  it("preserves every parsed heading in an external Org branch", () => {
    const source = {
      id: "research",
      file: "research.org",
      sourceFile: "blog/research.org",
    } as never;
    const headings = globalHeadingNodesForSource(source, [
      { level: 1, source: { rangeStart: 10 }, title: "Research", titleText: "Research" },
      { level: 2, source: { rangeStart: 20 }, title: "Evidence", titleText: "Evidence" },
      { level: 1, source: { rangeStart: 30 }, title: "Decisions", titleText: "Decisions" },
    ] as never);

    expect(headings).toHaveLength(3);
    expect(headings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "source-research/heading-10",
          parentId: "source-research",
          rangeStart: 10,
        }),
        expect.objectContaining({
          id: "source-research/heading-20",
          parentId: "source-research/heading-10",
        }),
        expect.objectContaining({ id: "source-research/heading-30", parentId: "source-research" }),
      ]),
    );
  });

  it("projects parser-owned Org links as traversable document relations", () => {
    const sources = [
      { id: "one", file: "one.org", sourceFile: "blog/one.org" },
      { id: "two", file: "two.org", sourceFile: "blog/two.org" },
    ] as never;
    const records = [
      [{ source: { rangeStart: 10 }, links: [{ path: "two.org" }], properties: [] }],
      [{ source: { rangeStart: 20 }, links: [{ path: "one.org" }], properties: [] }],
    ] as never;

    expect(globalOrgLinkRelations(sources, records)).toEqual([
      {
        id: "source-one/heading-10->source-two",
        sourceId: "source-one/heading-10",
        targetId: "source-two",
      },
      {
        id: "source-two/heading-20->source-one",
        sourceId: "source-two/heading-20",
        targetId: "source-one",
      },
    ]);
  });

  it("keeps TODO as heading state instead of inventing a relation node", () => {
    const facets = semanticFacetsFor({
      id: "source-one/heading-10",
      kind: "section",
      label: "Ship graph modes",
      level: 1,
      parentId: "source-one",
      rangeStart: 10,
      sourceFile: "blog/one.org",
      tags: ["graph"],
      todo: "NEXT",
    });

    expect(facets.map((node) => node.label)).toEqual(["#graph"]);
    expect(facets.some((node) => node.id.includes("/todo/"))).toBe(false);
  });

  it("joins local headings to the static link index before the global scope", () => {
    const nodes = [
      {
        id: "source-one",
        kind: "source" as const,
        label: "One",
        level: 1,
        parentId: "org-root",
        rangeStart: null,
        sourceFile: "blog/one.org",
        tags: [],
        todo: null,
      },
      {
        id: "source-one/heading-10",
        kind: "section" as const,
        label: "Current",
        level: 2,
        parentId: "source-one",
        rangeStart: 10,
        sourceFile: "blog/one.org",
        tags: [],
        todo: "NEXT",
      },
      {
        id: "source-one/heading-20",
        kind: "section" as const,
        label: "Linked",
        level: 2,
        parentId: "source-one",
        rangeStart: 20,
        sourceFile: "blog/one.org",
        tags: [],
        todo: null,
      },
    ];
    const relation = {
      id: "current-to-linked",
      sourceId: "source-one/heading-10",
      targetId: "source-one/heading-20",
    };
    const graph = projectOrgKnowledgeGraph(
      nodes,
      10,
      "blog/one.org",
      2,
      [relation],
      new Set(nodes.map((node) => node.id)),
    );

    expect(graph.relations).toEqual([relation]);
    expect(graph.nodes.find((node) => node.rangeStart === 10)?.todo).toBe("NEXT");
  });

  it("joins id links to parser-owned heading targets across the corpus", () => {
    const sources = [
      { id: "one", file: "one.org", sourceFile: "blog/one.org" },
      { id: "two", file: "two.org", sourceFile: "blog/two.org" },
    ] as never;
    const records = [
      [
        {
          source: { rangeStart: 10 },
          links: [{ path: "id:destination" }],
          properties: [],
        },
      ],
      [
        {
          source: { rangeStart: 20 },
          links: [],
          properties: [{ key: "ID", value: "destination" }],
        },
      ],
    ] as never;

    expect(globalOrgLinkRelations(sources, records)).toEqual([
      {
        id: "source-one/heading-10->source-two/heading-20",
        sourceId: "source-one/heading-10",
        targetId: "source-two/heading-20",
      },
    ]);
  });
});
