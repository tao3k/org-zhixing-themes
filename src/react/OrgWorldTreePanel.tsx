import { GraphIcon } from "@phosphor-icons/react/dist/csr/Graph";
import { TreeStructureIcon } from "@phosphor-icons/react/dist/csr/TreeStructure";
import { XIcon } from "@phosphor-icons/react/dist/csr/X";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import {
  contextualOrgWorldTreeNodes,
  currentWorldTreeDocument,
  currentWorldTreeSourceFile,
  orgWorldTreeFromSite,
  resolveWorldTreeNavigationTarget,
  subscribeWorldTreeDocument,
  worldTreeNodeIdForRangeStart,
  type OrgWorldTreeNode,
} from "./orgWorldTree";
import {
  OrgKnowledgeGraph,
  type KnowledgeGraphNode as MindMapNode,
  type KnowledgeGraphScenario,
} from "./OrgKnowledgeGraph";
import { loadStaticKnowledgeGraph, type StaticSiteData } from "../staticSiteData";
import type { KnowledgeGraphRelation as MindMapRelation } from "./OrgKnowledgeGraph";

type NodeRole = "ancestor" | "context" | "current" | "distant" | "root" | "source";

export function OrgWorldTreePanel({
  staticSite,
}: {
  staticSite: StaticSiteData | null;
}): ReactNode {
  const routeNavigate = useNavigate();
  const routeSearch = useSearch({ strict: false }) as { focus?: unknown };
  const documentView = useSyncExternalStore(
    subscribeWorldTreeDocument,
    currentWorldTreeDocument,
    () => null,
  );
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [activeRangeStart, setActiveRangeStart] = useState<number | null>(null);
  const [globalHeadings, setGlobalHeadings] = useState<readonly OrgWorldTreeNode[]>([]);
  const [globalRelations, setGlobalRelations] = useState<readonly MindMapRelation[]>([]);
  const [scenario, setScenario] = useState<KnowledgeGraphScenario>("graph");
  const [scope, setScope] = useState<1 | 2 | 3>(1);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressOpenUntil = useRef(0);
  const activeSourceFile = currentWorldTreeSourceFile();
  const requestedFocus = rangeStartFromSearch(routeSearch.focus);
  const tree = useMemo(
    () => (documentView ? orgWorldTreeFromSite(documentView, staticSite, activeSourceFile) : null),
    [activeSourceFile, documentView, staticSite],
  );

  useEffect(() => {
    setActiveRangeStart(tree?.nodes.find((node) => node.rangeStart !== null)?.rangeStart ?? null);
    setScope(1);
  }, [tree]);

  useEffect(() => {
    if (requestedFocus === null || !documentView) return;
    let frame = 0;
    let attempts = 0;
    const revealRequestedHeading = (): void => {
      const target = window.document.querySelector<HTMLElement>(
        `.viewer-pane [data-org-range-start="${requestedFocus}"]`,
      );
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        setActiveRangeStart(requestedFocus);
        return;
      }
      if (attempts >= 12) return;
      attempts += 1;
      frame = window.requestAnimationFrame(revealRequestedHeading);
    };
    frame = window.requestAnimationFrame(revealRequestedHeading);
    return () => window.cancelAnimationFrame(frame);
  }, [documentView, requestedFocus]);

  useEffect(() => {
    if (!staticSite) {
      setGlobalHeadings([]);
      setGlobalRelations([]);
      return;
    }
    let cancelled = false;
    void loadStaticKnowledgeGraph(staticSite).then((graph) => {
      if (cancelled) return;
      setGlobalHeadings(graph?.nodes ?? []);
      setGlobalRelations(graph?.relations ?? []);
    });
    return () => {
      cancelled = true;
    };
  }, [staticSite]);

  useEffect(() => {
    if (!tree?.nodes.length) return;
    const headings = [
      ...window.document.querySelectorAll<HTMLElement>(".viewer-pane [data-org-range-start]"),
    ];
    if (headings.length === 0 || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        const rangeStart = Number(
          (visible?.target as HTMLElement | undefined)?.dataset.orgRangeStart,
        );
        if (Number.isSafeInteger(rangeStart)) setActiveRangeStart(rangeStart);
      },
      { rootMargin: "-22% 0px -66%", threshold: 0 },
    );
    for (const heading of headings) observer.observe(heading);
    return () => observer.disconnect();
  }, [tree]);

  useEffect(() => {
    if (!open) return;
    const closeMapBeforeZen = (event: KeyboardEvent): void => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setPinned(false);
      setOpen(false);
    };
    window.addEventListener("keydown", closeMapBeforeZen, true);
    return () => window.removeEventListener("keydown", closeMapBeforeZen, true);
  }, [open]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (open) root.dataset.orgWorldTreeOpen = "true";
    else delete root.dataset.orgWorldTreeOpen;
    return () => {
      delete root.dataset.orgWorldTreeOpen;
    };
  }, [open]);

  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
      if (openTimer.current) clearTimeout(openTimer.current);
    },
    [],
  );

  const contextNodes = useMemo(
    () => (tree ? contextualOrgWorldTreeNodes(tree, activeRangeStart, scope) : []),
    [activeRangeStart, scope, tree],
  );
  const worldNodes = useMemo(
    () =>
      !tree
        ? []
        : scope === 3
          ? [...tree.worldSources, ...globalHeadings]
          : scope === 1
            ? contextNodes
            : tree.nodes,
    [contextNodes, globalHeadings, scope, tree],
  );
  const graph = useMemo(
    () =>
      projectOrgKnowledgeGraph(
        worldNodes,
        activeRangeStart,
        activeSourceFile,
        scope,
        globalRelations,
        new Set(contextNodes.map((node) => node.id)),
      ),
    [activeRangeStart, activeSourceFile, contextNodes, globalRelations, scope, worldNodes],
  );
  const navigationNodes = useMemo(
    () =>
      tree ? uniqueWorldTreeNodes([...tree.nodes, ...tree.worldSources, ...globalHeadings]) : [],
    [globalHeadings, tree],
  );

  if (!tree || tree.nodes.length === 0) return null;

  const retainOpen = (): void => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };
  const openMap = (): void => {
    if (openTimer.current) {
      clearTimeout(openTimer.current);
      openTimer.current = null;
    }
    if (Date.now() < suppressOpenUntil.current) return;
    retainOpen();
    if (open) return;
    setOpen(true);
  };
  const pinMap = (): void => {
    setPinned(true);
    openMap();
  };
  const scheduleOpen = (): void => {
    retainOpen();
    if (open || Date.now() < suppressOpenUntil.current) return;
    if (openTimer.current) clearTimeout(openTimer.current);
    openTimer.current = setTimeout(openMap, 120);
  };
  const deferClose = (): void => {
    if (pinned) return;
    if (openTimer.current) clearTimeout(openTimer.current);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 180);
  };
  const closeMap = (): void => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setPinned(false);
    setOpen(false);
  };
  const navigate = (node: MindMapNode): void => {
    // React Flow can replay pointer-enter while its node receives focus. A
    // short interaction lock lets the map fade before the reader takes focus.
    const target = resolveWorldTreeNavigationTarget(navigationNodes, node);
    if (!target) return;
    suppressOpenUntil.current = Date.now() + 320;
    closeMap();
    void routeNavigate({
      params: { articleId: String(target.articleRangeStart) },
      search: {
        focus: target.focusRangeStart,
        source: target.sourceFile,
      },
      to: "/blogs/$articleId",
    } as never);
  };
  const currentNodeId = graph.nodes.find((node) => node.role === "current")?.id ?? "org-root";
  const activeLabel =
    tree.nodes.find((node) => node.rangeStart === activeRangeStart)?.label ?? "Org source";

  return (
    <aside
      className={`org-world-tree${open ? " org-world-tree--open" : ""}`}
      aria-label="Org world tree"
      data-scope={scope}
    >
      <button
        type="button"
        className="org-world-tree-trigger"
        aria-expanded={open}
        aria-controls="org-world-tree-map"
        aria-label="Open current Org context"
        onClick={pinMap}
        onPointerEnter={scheduleOpen}
        onPointerLeave={deferClose}
      >
        <span className="org-world-tree-trigger-core" aria-hidden="true">
          <WorldTreeGlyph />
        </span>
        <span className="org-world-tree-trigger-line" aria-hidden="true" />
      </button>
      {open ? (
        <button
          type="button"
          className="org-world-tree-backdrop"
          aria-label="Close Org context"
          onClick={closeMap}
        />
      ) : null}
      <section
        id="org-world-tree-map"
        className="org-world-tree-map"
        aria-label={`Org context for ${activeLabel}`}
        aria-modal="true"
        aria-hidden={!open}
        role="dialog"
        onPointerEnter={retainOpen}
        onPointerLeave={deferClose}
      >
        <header className="org-world-tree-heading">
          <div>
            <span>Org context</span>
            <strong>{activeLabel}</strong>
          </div>
          <div className="org-world-tree-scenarios" role="group" aria-label="Knowledge view">
            <button
              type="button"
              aria-label="Knowledge graph"
              aria-pressed={scenario === "graph"}
              title="Knowledge graph"
              onClick={() => {
                setScenario("graph");
                setScope(1);
              }}
            >
              <GraphIcon weight="regular" />
            </button>
            <button
              type="button"
              aria-label="Mind map"
              aria-pressed={scenario === "mindmap"}
              title="Mind map"
              onClick={() => {
                setScenario("mindmap");
                setScope(1);
              }}
            >
              <TreeStructureIcon weight="regular" />
            </button>
          </div>
          <button
            type="button"
            className="org-world-tree-close"
            aria-label="Close Org context"
            onClick={closeMap}
          >
            <XIcon weight="bold" />
          </button>
        </header>
        <div className="org-world-tree-canvas">
          {open ? (
            <OrgKnowledgeGraph
              activeNodeId={currentNodeId}
              nodes={graph.nodes}
              relations={graph.relations}
              onNavigate={navigate}
              onScopeChange={setScope}
              scenario={scenario}
              scope={scope}
            />
          ) : null}
        </div>
        <footer className="org-world-tree-scope" aria-label={`Context depth ${scope} of 3`}>
          <i className={scope >= 1 ? "is-active" : undefined} />
          <i className={scope >= 2 ? "is-active" : undefined} />
          <i className={scope >= 3 ? "is-active" : undefined} />
        </footer>
      </section>
    </aside>
  );
}

const rangeStartFromSearch = (value: unknown): number | null => {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (typeof value === "string" && value.trim().length === 0) return null;
  const rangeStart = typeof value === "number" ? value : Number(value);
  return Number.isSafeInteger(rangeStart) && rangeStart >= 0 ? rangeStart : null;
};

const uniqueWorldTreeNodes = (nodes: readonly OrgWorldTreeNode[]): readonly OrgWorldTreeNode[] => [
  ...new Map(nodes.map((node) => [node.id, node])).values(),
];

function WorldTreeGlyph(): ReactNode {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M16 7v18M8 13l8 5 8-5M8 13v8M24 13v8" stroke="currentColor" strokeWidth="1.65" />
      <circle
        cx="16"
        cy="6.5"
        r="2.3"
        fill="var(--surface-paper)"
        stroke="currentColor"
        strokeWidth="1.65"
      />
      <circle
        cx="8"
        cy="13"
        r="2.3"
        fill="var(--surface-paper)"
        stroke="currentColor"
        strokeWidth="1.65"
      />
      <circle
        cx="24"
        cy="13"
        r="2.3"
        fill="var(--surface-paper)"
        stroke="currentColor"
        strokeWidth="1.65"
      />
      <circle
        cx="8"
        cy="24"
        r="2.3"
        fill="var(--surface-paper)"
        stroke="currentColor"
        strokeWidth="1.65"
      />
      <circle cx="16" cy="26" r="2.3" fill="currentColor" />
      <circle
        cx="24"
        cy="24"
        r="2.3"
        fill="var(--surface-paper)"
        stroke="currentColor"
        strokeWidth="1.65"
      />
    </svg>
  );
}

export const projectOrgKnowledgeGraph = (
  nodes: readonly OrgWorldTreeNode[],
  activeRangeStart: number | null,
  activeSourceFile: string | null,
  scope: 1 | 2 | 3,
  relations: readonly MindMapRelation[],
  focusNodeIds: ReadonlySet<string>,
): { nodes: MindMapNode[]; relations: readonly MindMapRelation[] } => {
  const root: OrgWorldTreeNode = {
    id: "org-root",
    kind: "section",
    label: "Org source",
    level: 0,
    parentId: "",
    rangeStart: null,
    tags: [],
    todo: null,
  };
  const baseNodes = [root, ...nodes];
  const active =
    (scope === 3
      ? baseNodes.find((node) => node.kind === "source" && node.sourceFile === activeSourceFile)
      : baseNodes.find((node) => node.rangeStart === activeRangeStart)) ?? root;
  const allNodes = scope === 3 ? baseNodes : [...baseNodes, ...semanticFacetsFor(active)];
  const childrenByParent = new Map<string, OrgWorldTreeNode[]>();
  for (const node of nodes) {
    const children = childrenByParent.get(node.parentId) ?? [];
    children.push(node);
    childrenByParent.set(node.parentId, children);
  }
  const positions = new Map<string, { depth: number; x: number; y: number }>();
  const byId = new Map(allNodes.map((node) => [node.id, node]));
  if (scope === 3) {
    return globalGraphFor(
      allNodes,
      childrenByParent,
      activeRangeStart,
      activeSourceFile,
      relations,
    );
  }

  // The focused heading is the visual origin. Its ancestry recedes into the
  // lower-left, while its real children open into a readable upper-right fan.
  // This preserves outline direction without reducing the map to a flowchart.
  positions.set(root.id, { depth: -2, x: -430, y: 260 });
  let ancestorId = active.parentId;
  let ancestorDepth = 1;
  while (ancestorId && ancestorId !== root.parentId) {
    const ancestor = byId.get(ancestorId);
    if (!ancestor) break;
    positions.set(ancestor.id, {
      depth: -ancestorDepth,
      x: -220 * ancestorDepth,
      y: 112 * ancestorDepth,
    });
    if (ancestor.id === root.id) break;
    ancestorId = ancestor.parentId;
    ancestorDepth += 1;
  }
  positions.set(active.id, { depth: 0, x: 0, y: 0 });

  const placeDescendants = (
    parentId: string,
    depth: number,
    bearing: number,
    sector: number,
  ): void => {
    const children = childrenByParent.get(parentId) ?? [];
    const parent = positions.get(parentId);
    if (!parent || children.length === 0) return;
    children.forEach((child) => {
      if (positions.has(child.id)) return;
      const index = children.indexOf(child);
      const childBearing =
        children.length === 1 ? bearing : bearing + (index / (children.length - 1) - 0.5) * sector;
      const radius = 205 + Math.min(depth, 4) * 42;
      positions.set(child.id, {
        depth,
        x: parent.x + Math.cos(childBearing) * radius,
        y: parent.y + Math.sin(childBearing) * radius,
      });
      placeDescendants(child.id, depth + 1, childBearing, Math.max(0.48, sector * 0.66));
    });
  };
  placeDescendants(active.id, 1, -0.54, 1.52);

  const peripheralRoots = allNodes.filter(
    (node) =>
      node.id !== root.id &&
      !focusNodeIds.has(node.id) &&
      focusNodeIds.has(node.parentId) &&
      !positions.has(node.id),
  );
  const placePeripheralBranch = (
    parentId: string,
    outward: { x: number; y: number },
    depth: number,
  ): void => {
    const parent = positions.get(parentId);
    if (!parent) return;
    const children = (childrenByParent.get(parentId) ?? []).filter(
      (node) => !positions.has(node.id),
    );
    if (children.length === 0) return;
    const tangent = { x: -outward.y, y: outward.x };
    children.forEach((child, index) => {
      const offset = (index - (children.length - 1) / 2) * 112;
      positions.set(child.id, {
        depth,
        x: parent.x + outward.x * 206 + tangent.x * offset,
        y: parent.y + outward.y * 206 + tangent.y * offset,
      });
      placePeripheralBranch(child.id, outward, depth + 1);
    });
  };
  peripheralRoots.forEach((node, index) => {
    const parent = positions.get(node.parentId) ?? positions.get(root.id)!;
    // Reserve the right-hand sector for the active branch. Distant headings
    // form calm, navigable constellations around their real parent instead.
    const angle = Math.PI * (0.64 + (1.72 * (index + 0.5)) / Math.max(1, peripheralRoots.length));
    const outward = { x: Math.cos(angle), y: Math.sin(angle) };
    positions.set(node.id, {
      depth: 1,
      x: parent.x + outward.x * 264,
      y: parent.y + outward.y * 264,
    });
    placePeripheralBranch(node.id, outward, 2);
  });

  const overflowNodes = allNodes.filter((node) => !positions.has(node.id));
  const rootPosition = positions.get(root.id) ?? { x: -560, y: 0 };
  for (const [index, node] of overflowNodes.entries()) {
    const ring = 280 + Math.sqrt(index) * 64;
    const angle = index * 2.399963229728653;
    positions.set(node.id, {
      depth: 1,
      x: rootPosition.x + Math.cos(angle) * ring,
      y: rootPosition.y + Math.sin(angle) * ring,
    });
  }
  if (scope === 1) placeFocusedNeighborhood(allNodes, active, byId, positions);
  const activePosition = positions.get(active.id) ?? { depth: 0, x: 0, y: 0 };
  const roleFor = (node: OrgWorldTreeNode): NodeRole => {
    if (node.id === root.id) return "root";
    if (node.kind === "source") {
      return "source";
    }
    if (node.kind === "facet") return "context";
    if (node.rangeStart === activeRangeStart) return "current";
    if (!focusNodeIds.has(node.id)) return "distant";
    return (positions.get(node.id)?.depth ?? 0) < activePosition.depth ? "ancestor" : "context";
  };
  return {
    nodes: allNodes.map((node) => {
      const position = positions.get(node.id) ?? { x: 0, y: 0 };
      return {
        id: node.id,
        label: node.label,
        parentId: node.parentId,
        rangeStart: node.rangeStart,
        role: roleFor(node),
        overview: false,
        sourceFile: node.sourceFile,
        tags: node.tags,
        todo: node.todo,
        x: position.x - activePosition.x,
        y: position.y - activePosition.y,
      };
    }),
    relations: relations.filter(
      (relation) => byId.has(relation.sourceId) && byId.has(relation.targetId),
    ),
  };
};

const placeFocusedNeighborhood = (
  nodes: readonly OrgWorldTreeNode[],
  active: OrgWorldTreeNode,
  byId: ReadonlyMap<string, OrgWorldTreeNode>,
  positions: Map<string, { depth: number; x: number; y: number }>,
): void => {
  const ancestorIds: string[] = [];
  let ancestorId = active.parentId;
  while (ancestorId) {
    const ancestor = byId.get(ancestorId);
    if (!ancestor) break;
    ancestorIds.push(ancestor.id);
    ancestorId = ancestor.parentId;
  }
  const ancestorSet = new Set(ancestorIds);
  const facets = nodes.filter((node) => node.kind === "facet");
  const context = nodes.filter(
    (node) => node.id !== active.id && !ancestorSet.has(node.id) && node.kind !== "facet",
  );

  positions.clear();
  positions.set(active.id, { depth: 0, x: 0, y: 0 });
  ancestorIds.forEach((id, index) => {
    positions.set(id, {
      depth: -(index + 1),
      x: -190 - index * 120,
      y: (index % 2 === 0 ? 1 : -1) * (42 + index * 20),
    });
  });
  facets.forEach((node, index) => {
    const progress = facets.length === 1 ? 0.5 : index / (facets.length - 1);
    const angle = 1.85 + progress * 1.15;
    const radius = 126 + (index % 2) * 24;
    positions.set(node.id, {
      depth: 1,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    });
  });
  context.forEach((node, index) => {
    const progress = context.length === 1 ? 0.5 : index / (context.length - 1);
    const angle = -1.02 + progress * 2.04;
    const radius = 218 + (index % 3) * 28;
    positions.set(node.id, {
      depth: 1,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    });
  });
};

export { worldTreeNodeIdForRangeStart };

/**
 * A focused heading carries parser-owned Org semantics, not decorative data.
 * Tags may appear as small satellites in the focal graph. TODO remains state
 * on its heading so task semantics never masquerade as a knowledge relation.
 */
export const semanticFacetsFor = (node: OrgWorldTreeNode): readonly OrgWorldTreeNode[] => {
  if (node.id === "org-root" || node.kind === "source") return [];
  const prefix = `${node.id}/facet`;
  return node.tags.map((tag) => ({
    id: `${prefix}/tag/${encodeURIComponent(tag)}`,
    kind: "facet" as const,
    label: `#${tag}`,
    level: node.level + 1,
    parentId: node.id,
    rangeStart: null,
    sourceFile: node.sourceFile,
    tags: [],
    todo: null,
  }));
};

const globalGraphFor = (
  allNodes: readonly OrgWorldTreeNode[],
  childrenByParent: ReadonlyMap<string, readonly OrgWorldTreeNode[]>,
  activeRangeStart: number | null,
  activeSourceFile: string | null,
  relations: readonly MindMapRelation[],
): { nodes: MindMapNode[]; relations: readonly MindMapRelation[] } => {
  const root = allNodes[0]!;
  // A corpus has no parser-owned parent node. Rendering the local convenience
  // root here turned every source into an artificial starburst, hiding the
  // real source-to-heading and cross-document communities.
  const graphNodes = allNodes.filter((node) => node.id !== root.id);
  const sources = graphNodes.filter((node) => node.kind === "source");
  const activeSource =
    sources.find((node) => node.sourceFile === activeSourceFile) ?? sources[0] ?? root;
  const activeHeading = graphNodes.find(
    (node) =>
      node.kind === "section" &&
      node.sourceFile === activeSourceFile &&
      node.rangeStart === activeRangeStart,
  );
  const activeNode = activeHeading ?? activeSource;
  const positions = new Map<string, { depth: number; x: number; y: number }>();
  const rootPosition = { depth: -1, x: -360, y: 160 };
  positions.set(root.id, rootPosition);
  positions.set(activeSource.id, { depth: 0, x: 0, y: 0 });

  const otherSources = sources.filter((source) => source.id !== activeSource.id);
  otherSources.forEach((source, index) => {
    const ring = 620 + Math.sqrt(index) * 148;
    const angle = index * 2.399963229728653 + 0.46;
    positions.set(source.id, {
      depth: 0,
      x: rootPosition.x + Math.cos(angle) * ring,
      y: rootPosition.y + Math.sin(angle) * ring * 0.78,
    });
  });

  for (const source of sources) {
    const sourcePosition = positions.get(source.id)!;
    if ((childrenByParent.get(source.id) ?? []).length === 0) continue;
    placeGlobalHeadingBranch({
      childrenByParent,
      parentId: source.id,
      positions,
      sourcePosition,
      bearing:
        source.id === activeSource.id
          ? -0.48
          : Math.atan2(sourcePosition.y - rootPosition.y, sourcePosition.x - rootPosition.x),
    });
  }

  const graphNodeIds = new Set(graphNodes.map((node) => node.id));
  return {
    nodes: graphNodes.map((node) => {
      const position = positions.get(node.id) ?? rootPosition;
      return {
        id: node.id,
        label: node.label,
        parentId: node.parentId,
        rangeStart: node.rangeStart,
        role: node.id === activeNode.id ? "current" : node.kind === "source" ? "source" : "distant",
        overview: node.kind === "source" && sources.length <= 24,
        sourceFile: node.sourceFile,
        tags: node.tags,
        todo: node.todo,
        x: position.x,
        y: position.y,
      };
    }),
    relations: relations.filter(
      (relation) => graphNodeIds.has(relation.sourceId) && graphNodeIds.has(relation.targetId),
    ),
  };
};

const placeGlobalHeadingBranch = ({
  childrenByParent,
  parentId,
  positions,
  sourcePosition,
  bearing,
}: {
  childrenByParent: ReadonlyMap<string, readonly OrgWorldTreeNode[]>;
  parentId: string;
  positions: Map<string, { depth: number; x: number; y: number }>;
  sourcePosition: { x: number; y: number };
  bearing: number;
}): void => {
  const place = (id: string, depth: number, parentBearing: number, sector: number): void => {
    const children = childrenByParent.get(id) ?? [];
    const parent = positions.get(id) ?? sourcePosition;
    for (const [index, child] of children.entries()) {
      const childBearing =
        children.length === 1
          ? parentBearing
          : parentBearing + (index / (children.length - 1) - 0.5) * sector;
      const radius = 156 + Math.min(depth, 4) * 76;
      positions.set(child.id, {
        depth,
        x: parent.x + Math.cos(childBearing) * radius,
        y: parent.y + Math.sin(childBearing) * radius,
      });
      place(child.id, depth + 1, childBearing, Math.max(0.42, sector * 0.64));
    }
  };
  place(parentId, 1, bearing, 1.72);
};
