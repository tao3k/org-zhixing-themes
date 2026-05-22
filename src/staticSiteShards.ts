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

type QueryCoreRuntime = typeof import("@tanstack/query-core");
type StaticShardQueryClient = import("@tanstack/query-core").QueryClient;

const queryClients = new WeakMap<StaticSiteData, StaticShardQueryClient>();
let queryCoreRuntimePromise: Promise<QueryCoreRuntime> | null = null;

export const loadCachedStaticSourceShard = (
  staticSite: StaticSiteData,
  key: string,
  shardPath: string,
): Promise<StaticSourceProjection | null> =>
  loadCachedShard(staticSite, "source", key, shardPath, fetchStaticSourceShard);

export const loadCachedStaticAgendaShard = (
  staticSite: StaticSiteData,
  key: string,
  shardPath: string,
): Promise<StaticAgendaShard | null> =>
  loadCachedShard(staticSite, "agenda", key, shardPath, fetchStaticAgendaShard);

export const loadCachedStaticMemoryShard = (
  staticSite: StaticSiteData,
  key: string,
  shardPath: string,
): Promise<OrgizeMemoryResponseDto | null> =>
  loadCachedShard(staticSite, "memory", key, shardPath, fetchStaticMemoryShard);

export const loadCachedStaticSectionShard = (
  staticSite: StaticSiteData,
  key: string,
  shardPath: string,
): Promise<OrgizeSectionIndexResponseDto | null> =>
  loadCachedShard(staticSite, "section", key, shardPath, fetchStaticSectionShard);

export const loadCachedStaticAttachmentShard = (
  staticSite: StaticSiteData,
  key: string,
  shardPath: string,
): Promise<OrgizeAttachmentInventoryResponseDto | null> =>
  loadCachedShard(staticSite, "attachment", key, shardPath, fetchStaticAttachmentShard);

const loadCachedShard = <T>(
  staticSite: StaticSiteData,
  kind: string,
  key: string,
  shardPath: string,
  fetchShard: (shardPath: string) => Promise<T | null>,
): Promise<T | null> =>
  queryClientFor(staticSite).then((client) =>
    client.fetchQuery({
      queryKey: ["org-zhixing-static-shard", staticSite.generatedAt, kind, key, shardPath],
      queryFn: () => fetchShard(shardPath),
      staleTime: Infinity,
      gcTime: Infinity,
    }),
  );

const queryClientFor = async (staticSite: StaticSiteData): Promise<StaticShardQueryClient> => {
  const cached = queryClients.get(staticSite);
  if (cached) {
    return cached;
  }
  const { QueryClient } = await queryCoreRuntime();
  const next = new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: Infinity,
        retry: false,
        staleTime: Infinity,
      },
    },
  });
  queryClients.set(staticSite, next);
  return next;
};

const queryCoreRuntime = (): Promise<QueryCoreRuntime> => {
  queryCoreRuntimePromise ??= import("@tanstack/query-core");
  return queryCoreRuntimePromise;
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
