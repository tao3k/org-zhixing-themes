import type {
  OrgizeAttachmentInventoryResponseDto,
  OrgizeMemoryResponseDto,
  OrgizeSectionIndexResponseDto,
} from "orgize/dto";
import { publicAssetUrl } from "./config";
import type {
  StaticAgendaShard,
  StaticAttachmentShard,
  StaticMemoryShard,
  StaticSectionShard,
  StaticSiteData,
  StaticSourceProjection,
} from "./staticSiteData";

const sourceCache = new WeakMap<
  StaticSiteData,
  Map<string, Promise<StaticSourceProjection | null>>
>();
const memoryCache = new WeakMap<
  StaticSiteData,
  Map<string, Promise<OrgizeMemoryResponseDto | null>>
>();
const sectionCache = new WeakMap<
  StaticSiteData,
  Map<string, Promise<OrgizeSectionIndexResponseDto | null>>
>();
const attachmentCache = new WeakMap<
  StaticSiteData,
  Map<string, Promise<OrgizeAttachmentInventoryResponseDto | null>>
>();
const agendaCache = new WeakMap<StaticSiteData, Map<string, Promise<StaticAgendaShard | null>>>();

export const loadCachedStaticSourceShard = (
  staticSite: StaticSiteData,
  key: string,
  shardPath: string,
): Promise<StaticSourceProjection | null> =>
  loadCachedShard(sourceCache, staticSite, key, shardPath, fetchStaticSourceShard);

export const loadCachedStaticAgendaShard = (
  staticSite: StaticSiteData,
  key: string,
  shardPath: string,
): Promise<StaticAgendaShard | null> =>
  loadCachedShard(agendaCache, staticSite, key, shardPath, fetchStaticAgendaShard);

export const loadCachedStaticMemoryShard = (
  staticSite: StaticSiteData,
  key: string,
  shardPath: string,
): Promise<OrgizeMemoryResponseDto | null> =>
  loadCachedShard(memoryCache, staticSite, key, shardPath, fetchStaticMemoryShard);

export const loadCachedStaticSectionShard = (
  staticSite: StaticSiteData,
  key: string,
  shardPath: string,
): Promise<OrgizeSectionIndexResponseDto | null> =>
  loadCachedShard(sectionCache, staticSite, key, shardPath, fetchStaticSectionShard);

export const loadCachedStaticAttachmentShard = (
  staticSite: StaticSiteData,
  key: string,
  shardPath: string,
): Promise<OrgizeAttachmentInventoryResponseDto | null> =>
  loadCachedShard(attachmentCache, staticSite, key, shardPath, fetchStaticAttachmentShard);

const loadCachedShard = <T>(
  cacheRoot: WeakMap<StaticSiteData, Map<string, Promise<T | null>>>,
  staticSite: StaticSiteData,
  key: string,
  shardPath: string,
  fetchShard: (shardPath: string) => Promise<T | null>,
): Promise<T | null> => {
  const cache = cacheFor(cacheRoot, staticSite);
  const cached = cache.get(key);
  if (cached) {
    return cached;
  }
  const loaded = fetchShard(shardPath);
  cache.set(key, loaded);
  return loaded;
};

const cacheFor = <T>(
  cacheRoot: WeakMap<StaticSiteData, Map<string, Promise<T | null>>>,
  staticSite: StaticSiteData,
): Map<string, Promise<T | null>> => {
  const cached = cacheRoot.get(staticSite);
  if (cached) {
    return cached;
  }
  const next = new Map<string, Promise<T | null>>();
  cacheRoot.set(staticSite, next);
  return next;
};

const fetchStaticSourceShard = async (
  shardPath: string,
): Promise<StaticSourceProjection | null> => {
  const value = await fetchJson<Partial<StaticSourceProjection>>(shardPath);
  return value?.viewIndex && value.html !== undefined ? (value as StaticSourceProjection) : null;
};

const fetchStaticAgendaShard = async (shardPath: string): Promise<StaticAgendaShard | null> => {
  const value = await fetchJson<Partial<StaticAgendaShard>>(shardPath);
  return value?.schemaVersion === 1 && value.agendaView ? (value as StaticAgendaShard) : null;
};

const fetchStaticMemoryShard = async (
  shardPath: string,
): Promise<OrgizeMemoryResponseDto | null> => {
  const value = await fetchJson<Partial<StaticMemoryShard>>(shardPath);
  return value?.schemaVersion === 1 && value.memory ? value.memory : null;
};

const fetchStaticSectionShard = async (
  shardPath: string,
): Promise<OrgizeSectionIndexResponseDto | null> => {
  const value = await fetchJson<Partial<StaticSectionShard>>(shardPath);
  return value?.schemaVersion === 1 && value.sectionIndex ? value.sectionIndex : null;
};

const fetchStaticAttachmentShard = async (
  shardPath: string,
): Promise<OrgizeAttachmentInventoryResponseDto | null> => {
  const value = await fetchJson<Partial<StaticAttachmentShard>>(shardPath);
  return value?.schemaVersion === 1 && value.attachmentInventory ? value.attachmentInventory : null;
};

const fetchJson = async <T>(shardPath: string): Promise<T | null> => {
  try {
    const response = await fetch(publicAssetUrl(shardPath));
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as T;
  } catch {
    return null;
  }
};
