import MiniSearch from "minisearch";
import type { ContentShellData } from "./services/contentServices";
import { loadOrgSearchSources } from "./services/contentServices";

export type OrgSearchDocumentId = string;
export type OrgSearchSourceId = string;
export type OrgSourcePath = string;

export type OrgSearchDocumentDto = {
  id: OrgSearchDocumentId;
  kind: "document" | "section";
  path: OrgSourcePath;
  route: string;
  sourceId: OrgSearchSourceId;
  tags: string;
  text: string;
  title: string;
  todo: string;
};

export type OrgSearchDocument = OrgSearchDocumentDto;

export type OrgSearchResult = OrgSearchDocument & {
  matchedFields: string[];
  score: number;
};

export type OrgSearchIndex = {
  count: number;
  search: (query: string) => OrgSearchResult[];
};

const plainText = (html: string): string =>
  html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(?:nbsp|#160);/gi, " ")
    .replace(/&(?:lt|#60);/gi, "<")
    .replace(/&(?:gt|#62);/gi, ">")
    .replace(/&(?:amp|#38);/gi, "&")
    .replace(/\s+/g, " ")
    .trim();

export const orgSearchDocuments = (
  sources: Awaited<ReturnType<typeof loadOrgSearchSources>>,
): OrgSearchDocument[] =>
  sources.flatMap((source) => {
    const documentTitle = source.orgTitle ?? source.name;
    const document: OrgSearchDocument = {
      id: `document:${source.id}`,
      kind: "document",
      path: source.sourceFile,
      route: `/${source.id}`,
      sourceId: source.id,
      tags: "",
      text: plainText(source.html).slice(0, 24_000),
      title: documentTitle,
      todo: "",
    };
    const sections: OrgSearchDocument[] = source.viewIndex.records.map((record) => ({
      id: `section:${source.id}:${record.rangeStart}`,
      kind: "section",
      path: source.sourceFile,
      route: `/${source.id}#section-${record.rangeStart}`,
      sourceId: source.id,
      tags: record.effectiveTags.join(" "),
      text: `${record.outline} ${record.bodyPreview}`.trim(),
      title: record.title,
      todo: record.todoState ?? record.todo ?? "",
    }));
    return [document, ...sections];
  });

export const createOrgSearchIndex = (documents: OrgSearchDocument[]): OrgSearchIndex => {
  const index = new MiniSearch<OrgSearchDocument>({
    fields: ["title", "text", "path", "tags", "todo"],
    storeFields: ["id", "kind", "path", "route", "sourceId", "tags", "text", "title", "todo"],
    searchOptions: {
      boost: { title: 6, tags: 4, todo: 3, path: 2, text: 1 },
      combineWith: "AND",
      fuzzy: 0.18,
      prefix: true,
    },
  });
  index.addAll(documents);
  return {
    count: documents.length,
    search: (query) =>
      index
        .search(query.trim())
        .slice(0, 24)
        .map((result) => ({
          id: String(result.id),
          kind: result.kind as OrgSearchDocument["kind"],
          matchedFields: Object.keys(result.match),
          path: String(result.path),
          route: String(result.route),
          score: result.score,
          sourceId: String(result.sourceId),
          tags: String(result.tags),
          text: String(result.text),
          title: String(result.title),
          todo: String(result.todo),
        })),
  };
};

export const loadOrgSearchIndex = async (shell: ContentShellData): Promise<OrgSearchIndex> =>
  createOrgSearchIndex(orgSearchDocuments(await loadOrgSearchSources(shell)));
