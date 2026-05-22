import type {
  OrgizeAgendaViewResponseDto,
  OrgizeAttachmentInventoryResponseDto,
  OrgizeLintResponseDto,
  OrgizeMemoryResponseDto,
  OrgizeSectionIndexResponseDto,
  OrgizeViewIndexResponseDto,
} from "orgize/dto";
import type { AgendaSettings, SiteConfig, SourceItem } from "./config";
import { publicAssetUrl } from "./config";
import { createAgentMemoryView } from "./memoryModel";
import {
  createDocumentView,
  withAgendaView,
  withAgentMemory,
  withAttachmentInventory,
  type BlogArticleRecord,
  type OrgizeDocumentView,
} from "./model";
import type { AttachmentGalleryView } from "./attachmentGalleryModel";
import type { TravelView } from "./travelModel";
import {
  loadCachedStaticAgendaShard,
  loadCachedStaticAttachmentShard,
  loadCachedStaticMemoryShard,
  loadCachedStaticSectionShard,
  loadCachedStaticSourceShard,
} from "./staticSiteShards";

export type StaticSourceSummary = {
  id: string;
  name: string;
  orgTitle?: string;
  file: string;
  sourceFile: string;
  sourceBytes: number;
  shardPath?: string;
  agendaShardPath?: string;
  attachmentShardPath?: string;
  memoryShardPath?: string;
  sectionShardPath?: string;
};

export type StaticSourceProjection = {
  id: string;
  name: string;
  orgTitle?: string;
  file: string;
  sourceFile: string;
  sourceBytes: number;
  agendaRange?: AgendaSettings;
  agendaShardPath?: string;
  viewIndex: OrgizeViewIndexResponseDto;
  sectionIndex?: OrgizeSectionIndexResponseDto;
  sectionShardPath?: string;
  html: string;
  attachmentInventory?: OrgizeAttachmentInventoryResponseDto;
  attachmentShardPath?: string;
  memory?: OrgizeMemoryResponseDto;
  memoryShardPath?: string;
  agendaView?: OrgizeAgendaViewResponseDto;
  lint: OrgizeLintResponseDto;
};

export type StaticAgendaShard = {
  schemaVersion: 1;
  sourceId: string;
  sourceFile: string;
  agendaRange?: AgendaSettings;
  agendaView: OrgizeAgendaViewResponseDto;
};

export type StaticMemoryShard = {
  schemaVersion: 1;
  sourceId: string;
  sourceFile: string;
  memory: OrgizeMemoryResponseDto;
};

export type StaticSectionShard = {
  schemaVersion: 1;
  sourceId: string;
  sourceFile: string;
  sectionIndex: OrgizeSectionIndexResponseDto;
};

export type StaticAttachmentShard = {
  schemaVersion: 1;
  sourceId: string;
  sourceFile: string;
  attachmentInventory: OrgizeAttachmentInventoryResponseDto;
};

export type StaticBlogArticle = BlogArticleRecord & {
  file: string;
  sourceFile: string;
  sourceId: string;
  sourceName: string;
};

export type StaticBlogIndex = {
  articleCount: number;
  articles: StaticBlogArticle[];
  dateRange: { end: string; start: string } | null;
  siteWide: true;
  sourceCount: number;
  tagFacets: Array<{ count: number; tag: string }>;
};

export type StaticSiteData = {
  schemaVersion: 1;
  generatedAt: string;
  configPath: string;
  orgize: {
    buildTime: string;
    gitHash: string;
  };
  attachmentGallery?: AttachmentGalleryView;
  blog?: StaticBlogIndex;
  travel?: TravelView;
  sources: StaticSource[];
};

export type StaticSource = StaticSourceProjection | StaticSourceSummary;

export type StaticDocumentViewOptions = {
  agenda: AgendaSettings;
  memory?: OrgizeMemoryResponseDto | null;
  sectionIndex?: OrgizeSectionIndexResponseDto | null;
  attachmentInventory?: OrgizeAttachmentInventoryResponseDto | null;
  agendaView?: OrgizeAgendaViewResponseDto | null;
  agendaRange?: AgendaSettings | null;
};

export const loadStaticSiteData = async (): Promise<StaticSiteData | null> => {
  try {
    const response = await fetch(publicAssetUrl("org-zhixing.static.json"));
    if (!response.ok) {
      return null;
    }
    const value = (await response.json()) as Partial<StaticSiteData>;
    if (value.schemaVersion !== 1 || !Array.isArray(value.sources)) {
      return null;
    }
    return value as StaticSiteData;
  } catch {
    return null;
  }
};

export const loadStaticSourceFor = async (
  staticSite: StaticSiteData | null,
  source: SourceItem,
): Promise<StaticSourceProjection | null> => {
  if (!staticSite) {
    return null;
  }
  const matched = findStaticSource(staticSite, source) ?? null;
  return matched ? loadStaticSource(staticSite, matched) : null;
};

export const loadStaticMemoryForSource = async (
  staticSite: StaticSiteData | null,
  source: SourceItem | StaticSource,
): Promise<OrgizeMemoryResponseDto | null> => {
  if (!staticSite) {
    return null;
  }
  if (isStaticSourceProjection(source) && source.memory) {
    return source.memory;
  }
  const matched = findStaticSource(staticSite, source);
  if (matched && isStaticSourceProjection(matched) && matched.memory) {
    return matched.memory;
  }
  const shardPath =
    matched?.memoryShardPath ?? ("memoryShardPath" in source ? source.memoryShardPath : undefined);
  if (!shardPath) {
    return null;
  }
  const key = matched?.sourceFile ?? source.sourceFile;
  return loadCachedStaticMemoryShard(staticSite, key, shardPath);
};

export const loadStaticSectionIndexForSource = async (
  staticSite: StaticSiteData | null,
  source: SourceItem | StaticSource,
): Promise<OrgizeSectionIndexResponseDto | null> => {
  if (!staticSite) {
    return null;
  }
  if (isStaticSourceProjection(source) && source.sectionIndex) {
    return source.sectionIndex;
  }
  const matched = findStaticSource(staticSite, source);
  if (matched && isStaticSourceProjection(matched) && matched.sectionIndex) {
    return matched.sectionIndex;
  }
  const shardPath =
    matched?.sectionShardPath ??
    ("sectionShardPath" in source ? source.sectionShardPath : undefined);
  if (!shardPath) {
    return null;
  }
  const key = matched?.sourceFile ?? source.sourceFile;
  return loadCachedStaticSectionShard(staticSite, key, shardPath);
};

export const loadStaticAttachmentInventoryForSource = async (
  staticSite: StaticSiteData | null,
  source: SourceItem | StaticSource,
): Promise<OrgizeAttachmentInventoryResponseDto | null> => {
  if (!staticSite) {
    return null;
  }
  if (isStaticSourceProjection(source) && source.attachmentInventory) {
    return source.attachmentInventory;
  }
  const matched = findStaticSource(staticSite, source);
  if (matched && isStaticSourceProjection(matched) && matched.attachmentInventory) {
    return matched.attachmentInventory;
  }
  const shardPath =
    matched?.attachmentShardPath ??
    ("attachmentShardPath" in source ? source.attachmentShardPath : undefined);
  if (!shardPath) {
    return null;
  }
  const key = matched?.sourceFile ?? source.sourceFile;
  return loadCachedStaticAttachmentShard(staticSite, key, shardPath);
};

export const loadStaticAgendaForSource = async (
  staticSite: StaticSiteData | null,
  source: SourceItem | StaticSource,
): Promise<StaticAgendaShard | null> => {
  if (!staticSite) {
    return null;
  }
  if (isStaticSourceProjection(source) && source.agendaView) {
    return {
      schemaVersion: 1,
      sourceId: source.id,
      sourceFile: source.sourceFile,
      agendaRange: source.agendaRange,
      agendaView: source.agendaView,
    };
  }
  const matched = findStaticSource(staticSite, source);
  if (matched && isStaticSourceProjection(matched) && matched.agendaView) {
    return {
      schemaVersion: 1,
      sourceId: matched.id,
      sourceFile: matched.sourceFile,
      agendaRange: matched.agendaRange,
      agendaView: matched.agendaView,
    };
  }
  const shardPath =
    matched?.agendaShardPath ?? ("agendaShardPath" in source ? source.agendaShardPath : undefined);
  if (!shardPath) {
    return null;
  }
  const key = matched?.sourceFile ?? source.sourceFile;
  return loadCachedStaticAgendaShard(staticSite, key, shardPath);
};

export const loadAllStaticSources = async (
  staticSite: StaticSiteData | null,
  options: { attachmentInventory?: boolean; sectionIndex?: boolean } = {},
): Promise<StaticSourceProjection[]> =>
  staticSite
    ? (
        await Promise.all(
          staticSite.sources.map(async (source) => {
            let projection = await loadStaticSource(staticSite, source);
            if (!projection) {
              return null;
            }
            if (options.sectionIndex) {
              const sectionIndex = await loadStaticSectionIndexForSource(staticSite, projection);
              projection = withStaticSectionIndex(projection, sectionIndex);
            }
            if (options.attachmentInventory) {
              const attachmentInventory = await loadStaticAttachmentInventoryForSource(
                staticSite,
                projection,
              );
              projection = withStaticAttachmentInventory(projection, attachmentInventory);
            }
            return projection;
          }),
        )
      ).filter((source): source is StaticSourceProjection => Boolean(source))
    : [];

export const staticSourceFor = (
  staticSite: StaticSiteData | null,
  source: SourceItem,
): StaticSource | null => (staticSite ? findStaticSource(staticSite, source) : null);

export const sourceItemsFromStaticSite = (staticSite: StaticSiteData | null): SourceItem[] =>
  staticSite?.sources.map((source) => ({
    id: source.id,
    name: source.orgTitle ?? source.name,
    file: source.file,
    sourceFile: source.sourceFile,
  })) ?? [];

export const withStaticSiteSources = (
  config: SiteConfig,
  staticSite: StaticSiteData | null,
): SiteConfig => {
  const sources = sourceItemsFromStaticSite(staticSite);
  return sources.length > 0 ? { ...config, sources } : config;
};

export const isStaticSourceProjection = (
  source: SourceItem | StaticSource,
): source is StaticSourceProjection => "viewIndex" in source;

export const documentViewFromStaticSource = (
  source: StaticSourceProjection,
  options: StaticDocumentViewOptions,
): OrgizeDocumentView => {
  const memory = staticDocumentOption(options, "memory", source.memory ?? null);
  const sectionIndex = staticDocumentOption(options, "sectionIndex", source.sectionIndex ?? null);
  const attachmentInventory = staticDocumentOption(
    options,
    "attachmentInventory",
    source.attachmentInventory ?? null,
  );
  const agendaView = staticDocumentOption(options, "agendaView", source.agendaView ?? null);
  const agendaRange =
    staticDocumentOption(options, "agendaRange", source.agendaRange ?? options.agenda) ??
    options.agenda;
  let document = createDocumentView(
    source.viewIndex.records,
    source.lint.findings,
    sectionIndex?.records ?? [],
  );
  if (attachmentInventory) {
    document = withAttachmentInventory(document, attachmentInventory);
  }
  if (memory) {
    document = withAgentMemory(document, createAgentMemoryView(memory));
  }
  return agendaView ? withAgendaView(document, agendaView, agendaRange) : document;
};

export const withStaticSectionIndex = (
  source: StaticSourceProjection,
  sectionIndex: OrgizeSectionIndexResponseDto | null,
): StaticSourceProjection => (sectionIndex ? { ...source, sectionIndex } : source);

export const withStaticAttachmentInventory = (
  source: StaticSourceProjection,
  attachmentInventory: OrgizeAttachmentInventoryResponseDto | null,
): StaticSourceProjection => (attachmentInventory ? { ...source, attachmentInventory } : source);

const findStaticSource = (
  staticSite: StaticSiteData,
  source: SourceItem | StaticSource,
): StaticSource | null =>
  staticSite.sources.find(
    (item) =>
      item.sourceFile === source.sourceFile || item.file === source.file || item.id === source.id,
  ) ?? null;

const loadStaticSource = async (
  staticSite: StaticSiteData,
  source: StaticSource,
): Promise<StaticSourceProjection | null> => {
  if (isStaticSourceProjection(source)) {
    return source;
  }
  if (!source.shardPath) {
    return null;
  }
  const key = source.sourceFile;
  return loadCachedStaticSourceShard(staticSite, key, source.shardPath);
};

const staticDocumentOption = <Key extends keyof StaticDocumentViewOptions>(
  options: StaticDocumentViewOptions,
  key: Key,
  fallback: NonNullable<StaticDocumentViewOptions[Key]> | null,
): NonNullable<StaticDocumentViewOptions[Key]> | null =>
  Object.prototype.hasOwnProperty.call(options, key)
    ? ((options[key] ?? null) as NonNullable<StaticDocumentViewOptions[Key]> | null)
    : fallback;
