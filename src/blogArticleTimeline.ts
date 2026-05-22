import { blogArticles, type BlogArticleRecord, type OrgizeDocumentView } from "./model";

const articleRailLimit = 7;
type DatedArticle = Pick<BlogArticleRecord, "planning" | "properties" | "rangeStart">;

export const blogTimelineArticles = (document: OrgizeDocumentView): BlogArticleRecord[] =>
  [...blogArticles(document)].sort(compareArticleRecency);

export const blogRailItems = (
  articles: BlogArticleRecord[],
  selectedRangeStart: number | null,
): BlogArticleRecord[] => {
  if (articles.length <= articleRailLimit) {
    return articles;
  }
  const selectedIndex = articles.findIndex((article) => article.rangeStart === selectedRangeStart);
  const start =
    selectedIndex >= 0
      ? Math.max(0, Math.min(selectedIndex - 2, articles.length - articleRailLimit))
      : 0;
  return articles.slice(start, start + articleRailLimit);
};

export const articleDateLabel = (article: DatedArticle): string =>
  articleDateText(article) ?? "Article";

export type BlogTagFacet = {
  count: number;
  tag: string;
};

export const blogTagFacets = (articles: BlogArticleRecord[]): BlogTagFacet[] => {
  const counts = new Map<string, number>();
  for (const article of articles) {
    for (const tag of article.effectiveTags) {
      const normalized = tag.toLowerCase();
      if (normalized === "blog") {
        continue;
      }
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ count, tag }))
    .sort((left, right) => right.count - left.count || left.tag.localeCompare(right.tag))
    .slice(0, 10);
};

export const articleDateRankForIndex = (article: DatedArticle): number | null =>
  articleDateRank(article);

export const articleDateIsoForIndex = (article: DatedArticle): string | null => {
  const rank = articleDateRank(article);
  return rank === null ? null : new Date(rank).toISOString().slice(0, 10);
};

const compareArticleRecency = (left: BlogArticleRecord, right: BlogArticleRecord): number => {
  const leftRank = articleDateRank(left);
  const rightRank = articleDateRank(right);
  if (leftRank !== null && rightRank !== null && leftRank !== rightRank) {
    return rightRank - leftRank;
  }
  if (leftRank !== null) return -1;
  if (rightRank !== null) return 1;
  return left.rangeStart - right.rangeStart;
};

const articleDateRank = (article: DatedArticle): number | null => {
  const text = articleDateText(article);
  if (!text) {
    return null;
  }
  const match = text.match(/(\d{4}-\d{2}-\d{2})(?:\s+\w+)?(?:\s+(\d{1,2}:\d{2}))?/);
  if (!match) {
    return null;
  }
  const timestamp = Date.parse(`${match[1]}T${match[2] ?? "00:00"}:00Z`);
  return Number.isNaN(timestamp) ? null : timestamp;
};

const articleDateText = (article: DatedArticle): string | null =>
  propertyValue(article, "CLOSED") ??
  propertyValue(article, "DATE") ??
  propertyValue(article, "SCHEDULED") ??
  article.planning.closed ??
  article.planning.scheduled ??
  null;

const propertyValue = (record: DatedArticle, key: string): string | null =>
  record.properties.find((property) => property.key.toUpperCase() === key)?.value ?? null;
