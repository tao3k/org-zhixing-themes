import type { OrgizeSectionIndexRecordDto, OrgizeViewIndexRecordDto } from "orgize/dto";
import type { OrgizeDocumentView } from "../model";
import type { StaticSiteData, StaticSource } from "../staticSiteData";
import { resolveOrgLinkHref } from "../orgIdLinks";
import type { KnowledgeGraphRelation as MindMapRelation } from "./OrgKnowledgeGraph";

export type OrgWorldTreeNode = {
  current?: boolean;
  id: string;
  kind?: "facet" | "section" | "source";
  label: string;
  level: number;
  parentId: string;
  rangeStart: number | null;
  sourceFile?: string;
  tags: readonly string[];
  todo: string | null;
};

export type OrgWorldTree = {
  nodes: readonly OrgWorldTreeNode[];
  rootId: string;
  worldClusters: readonly OrgWorldTreeCluster[];
  /** One lightweight landmark per indexed Org file; headings stay lazy. */
  worldSources: readonly OrgWorldTreeNode[];
};

export type OrgWorldTreeCluster = {
  count: number;
  id: string;
  label: string;
};

export type OrgWorldTreeNavigationTarget = {
  articleRangeStart: number;
  focusRangeStart: number;
  sourceFile: string;
};

const rootId = "org-root";

export const orgWorldTreeFromDocument = (document: OrgizeDocumentView): OrgWorldTree => {
  const records = document.sectionIndex.filter((record) => record.title.trim().length > 0);
  const stack: Array<{ id: string; level: number }> = [];
  const nodes = records.map((record, index) => {
    while (stack.length > 0 && stack.at(-1)!.level >= record.level) stack.pop();
    const id = worldTreeId(record, index);
    const node: OrgWorldTreeNode = {
      id,
      kind: "section",
      label: record.title,
      level: record.level,
      parentId: stack.at(-1)?.id ?? rootId,
      rangeStart: record.rangeStart,
      tags: record.effectiveTags,
      todo: record.todo || null,
    };
    stack.push({ id, level: record.level });
    return node;
  });
  return { nodes, rootId, worldClusters: [], worldSources: [] };
};

/**
 * The map's permanent terrain comes from the static Org source index. Only
 * the focused source expands into its already-parsed outline, avoiding a
 * second corpus-wide parser pass in the reader.
 */
export const orgWorldTreeFromSite = (
  document: OrgizeDocumentView,
  staticSite: StaticSiteData | null,
  activeSourceFile: string | null,
): OrgWorldTree => {
  if (!staticSite?.sources.length || !activeSourceFile) return orgWorldTreeFromDocument(document);
  const activeSource = staticSite.sources.find((source) => source.sourceFile === activeSourceFile);
  if (!activeSource) return orgWorldTreeFromDocument(document);
  const sourceRootId = worldTreeSourceId(activeSource.id);
  const localTree = orgWorldTreeFromDocument(document);
  const sourceNodes = [activeSource].map((source) => ({
    id: sourceRootId,
    kind: "source" as const,
    label: source.orgTitle ?? source.name,
    level: 1,
    parentId: rootId,
    rangeStart: null,
    sourceFile: source.sourceFile,
    tags: [],
    todo: null,
  }));
  const worldSources = staticSite.sources.map((source) => ({
    id: worldTreeSourceId(source.id),
    kind: "source" as const,
    label: source.orgTitle ?? source.name,
    level: 1,
    parentId: rootId,
    rangeStart: null,
    sourceFile: source.sourceFile,
    tags: [],
    todo: null,
  }));
  const localNodeIds = new Map(
    localTree.nodes.map((node) => [node.id, `${sourceRootId}/heading-${node.rangeStart}`]),
  );
  const localNodes = localTree.nodes.map((node) => ({
    ...node,
    id: localNodeIds.get(node.id)!,
    parentId:
      node.parentId === localTree.rootId
        ? sourceRootId
        : (localNodeIds.get(node.parentId) ?? sourceRootId),
    sourceFile: activeSourceFile,
  }));
  return {
    nodes: [...sourceNodes, ...localNodes],
    rootId,
    worldClusters: worldClustersFromSources(staticSite.sources),
    worldSources,
  };
};

export const contextualOrgWorldTreeNodes = (
  tree: OrgWorldTree,
  activeRangeStart: number | null,
  scope: 1 | 2 | 3,
): readonly OrgWorldTreeNode[] => {
  if (scope === 3 || activeRangeStart === null) return tree.nodes;
  if (scope === 2) return tree.nodes;
  const current = tree.nodes.find((node) => node.rangeStart === activeRangeStart);
  if (!current) return tree.nodes;
  const byId = new Map(tree.nodes.map((node) => [node.id, node]));
  const selected = new Set<string>([current.id]);
  let parentId = current.parentId;
  while (parentId !== tree.rootId) {
    selected.add(parentId);
    parentId = byId.get(parentId)?.parentId ?? tree.rootId;
  }
  const includeDescendants = (id: string, depth: number): void => {
    if (depth > 1) return;
    for (const child of tree.nodes.filter((node) => node.parentId === id)) {
      selected.add(child.id);
      includeDescendants(child.id, depth + 1);
    }
  };
  includeDescendants(current.id, 1);
  return tree.nodes.filter((node) => selected.has(node.id));
};

const worldTreeId = (record: OrgizeViewIndexRecordDto, index: number): string =>
  `org-${record.rangeStart || index}`;

const worldTreeSourceId = (sourceId: string): string => `source-${sourceId}`;

const worldClustersFromSources = (
  sources: readonly { sourceFile: string }[],
): readonly OrgWorldTreeCluster[] => {
  const counts = new Map<string, number>();
  for (const source of sources) {
    const separator = source.sourceFile.lastIndexOf("/");
    const label = separator === -1 ? "Org sources" : source.sourceFile.slice(0, separator);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([label, count]) => ({
      id: label.toLowerCase().replaceAll("/", "-"),
      label,
      count,
    }));
};

const listeners = new Set<() => void>();
let activeDocument: OrgizeDocumentView | null = null;
let activeSourceFile: string | null = null;
export const ORG_WORLD_TREE_DOCUMENT_EVENT = "org-zhixing:world-tree-document";

const notify = (): void => {
  for (const listener of listeners) listener();
};

export const setWorldTreeDocument = (
  document: OrgizeDocumentView,
  sourceFile: string | null = null,
): void => {
  if (activeDocument === document && activeSourceFile === sourceFile) return;
  activeDocument = document;
  activeSourceFile = sourceFile;
  notify();
  window.dispatchEvent(
    new CustomEvent<OrgizeDocumentView | null>(ORG_WORLD_TREE_DOCUMENT_EVENT, { detail: document }),
  );
};

export const clearWorldTreeDocument = (document: OrgizeDocumentView): void => {
  if (activeDocument !== document) return;
  activeDocument = null;
  activeSourceFile = null;
  notify();
  window.dispatchEvent(
    new CustomEvent<OrgizeDocumentView | null>(ORG_WORLD_TREE_DOCUMENT_EVENT, { detail: null }),
  );
};

export const subscribeWorldTreeDocument = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const currentWorldTreeDocument = (): OrgizeDocumentView | null => activeDocument;

export const currentWorldTreeSourceFile = (): string | null => activeSourceFile;

/** Resolves a parser-owned source identity to the route's canonical document id. */
export const sourceIdForWorldTreeSourceFile = (
  sources: readonly Pick<StaticSource, "id" | "sourceFile">[],
  sourceFile: string | undefined,
): string | null =>
  sourceFile ? (sources.find((source) => source.sourceFile === sourceFile)?.id ?? null) : null;

/**
 * Resolves any visual graph node to the parser-owned article route and heading
 * range. Source landmarks open their first article; semantic satellites return
 * to their owning heading before the top-level article ancestor is resolved.
 */
export const resolveWorldTreeNavigationTarget = (
  nodes: readonly OrgWorldTreeNode[],
  target: Pick<OrgWorldTreeNode, "id" | "parentId" | "rangeStart" | "sourceFile">,
): OrgWorldTreeNavigationTarget | null => {
  if (!target.sourceFile) return null;
  const byId = new Map(nodes.map((node) => [node.id, node]));
  let heading = target.rangeStart === null ? byId.get(target.parentId) : byId.get(target.id);
  if (!heading || heading.rangeStart === null || heading.sourceFile !== target.sourceFile) {
    heading = nodes.find(
      (node) =>
        node.sourceFile === target.sourceFile &&
        node.rangeStart !== null &&
        (byId.get(node.parentId)?.kind === "source" ||
          byId.get(node.parentId)?.sourceFile !== target.sourceFile),
    );
  }
  if (!heading || heading.rangeStart === null) return null;

  let article = heading;
  let parent = byId.get(article.parentId);
  while (parent && parent.rangeStart !== null && parent.sourceFile === target.sourceFile) {
    article = parent;
    parent = byId.get(article.parentId);
  }
  if (article.rangeStart === null) return null;
  return {
    articleRangeStart: article.rangeStart,
    focusRangeStart: heading.rangeStart,
    sourceFile: target.sourceFile,
  };
};

export const worldTreeNodeIdForRangeStart = (rangeStart: number): string => `org-${rangeStart}`;

/** Projects every parser-owned heading; view code chooses the level of detail. */
export const globalHeadingNodesForSource = (
  source: StaticSource,
  records: readonly OrgizeSectionIndexRecordDto[],
): readonly OrgWorldTreeNode[] =>
  records.reduce<OrgWorldTreeNode[]>((nodes, record) => {
    if (record.titleText.trim().length === 0) return nodes;
    // Projected levels include the source landmark at level 1. Therefore the
    // parser's H1 starts at level 2, and only a strictly shallower heading can
    // become its parent.
    const parent = [...nodes].reverse().find((node) => node.level < record.level + 1);
    nodes.push({
      id: `source-${source.id}/heading-${record.source.rangeStart}`,
      kind: "section",
      label: record.titleText || record.title,
      level: record.level + 1,
      parentId: parent?.id ?? `source-${source.id}`,
      rangeStart: record.source.rangeStart,
      sourceFile: source.sourceFile,
      tags: record.effectiveTags ?? [],
      todo: record.todo ?? null,
    });
    return nodes;
  }, []);

/**
 * Links are already structured by the WASM parser. Their inverse relation is
 * obtained from the same directed edge set, rather than by reparsing rendered
 * HTML or carrying a second backlink store.
 */
export const globalOrgLinkRelations = (
  sources: readonly StaticSource[],
  recordsBySource: readonly (readonly OrgizeSectionIndexRecordDto[])[],
): readonly MindMapRelation[] => {
  const documents = sources.map((source) => ({ file: source.file, id: source.id }));
  const knownSourceIds = new Set(sources.map((source) => source.id));
  const headingIdsByOrgId = new Map<string, string>();
  recordsBySource.forEach((records, index) => {
    const source = sources[index]!;
    for (const record of records) {
      const headingId = `source-${source.id}/heading-${record.source.rangeStart}`;
      for (const property of record.properties) {
        if (["ID", "CUSTOM_ID"].includes(property.key.toUpperCase()) && property.value.trim()) {
          headingIdsByOrgId.set(property.value.trim(), headingId);
        }
      }
    }
  });
  const relations = new Map<string, MindMapRelation>();
  recordsBySource.forEach((records, index) => {
    const source = sources[index]!;
    for (const record of records) {
      for (const link of record.links) {
        const targetId = orgLinkTargetId(link.path, {
          currentFile: source.file,
          documents,
          headingIdsByOrgId,
          knownSourceIds,
        });
        if (!targetId) continue;
        const sourceId = `source-${source.id}/heading-${record.source.rangeStart}`;
        if (sourceId === targetId) continue;
        const id = `${sourceId}->${targetId}`;
        relations.set(id, { id, sourceId, targetId });
      }
    }
  });
  return [...relations.values()];
};

const orgLinkTargetId = (
  href: string,
  {
    currentFile,
    documents,
    headingIdsByOrgId,
    knownSourceIds,
  }: {
    currentFile: string;
    documents: readonly { file: string; id: string }[];
    headingIdsByOrgId: ReadonlyMap<string, string>;
    knownSourceIds: ReadonlySet<string>;
  },
): string | null => {
  if (href.startsWith("id:")) {
    return headingIdsByOrgId.get(decodeOrgLinkId(href.slice("id:".length))) ?? null;
  }
  const route = resolveOrgLinkHref(href, { currentFile, documents });
  if (!route) return null;
  const targetSourceId = new URL(route, "https://org-zhixing.local").pathname.slice(1);
  return knownSourceIds.has(targetSourceId) ? `source-${targetSourceId}` : null;
};

const decodeOrgLinkId = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};
