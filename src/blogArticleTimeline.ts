import type { OrgizeViewIndexRecordDto } from "orgize/dto";
import { blogArticles, type OrgizeDocumentView } from "./model";

const articleRailLimit = 7;

export const blogTimelineArticles = (document: OrgizeDocumentView): OrgizeViewIndexRecordDto[] =>
  [...blogArticles(document)].sort(compareArticleRecency);

export const blogRailItems = (
  articles: OrgizeViewIndexRecordDto[],
  selectedRangeStart: number | null,
): OrgizeViewIndexRecordDto[] => {
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

export const articleDateLabel = (article: OrgizeViewIndexRecordDto): string =>
  articleDateText(article) ?? "Article";

const compareArticleRecency = (
  left: OrgizeViewIndexRecordDto,
  right: OrgizeViewIndexRecordDto,
): number => {
  const leftRank = articleDateRank(left);
  const rightRank = articleDateRank(right);
  if (leftRank !== null && rightRank !== null && leftRank !== rightRank) {
    return rightRank - leftRank;
  }
  if (leftRank !== null) return -1;
  if (rightRank !== null) return 1;
  return left.rangeStart - right.rangeStart;
};

const articleDateRank = (article: OrgizeViewIndexRecordDto): number | null => {
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

const articleDateText = (article: OrgizeViewIndexRecordDto): string | null =>
  propertyValue(article, "CLOSED") ??
  propertyValue(article, "DATE") ??
  propertyValue(article, "SCHEDULED") ??
  article.planning.closed ??
  article.planning.scheduled ??
  null;

const propertyValue = (record: OrgizeViewIndexRecordDto, key: string): string | null =>
  record.properties.find((property) => property.key.toUpperCase() === key)?.value ?? null;
