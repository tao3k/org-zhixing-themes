import { blogTimelineArticles } from "./blogArticleTimeline";
import type { OrgizeDocumentView } from "./model";
import type { BlogArticleSelection } from "./blogState";
import type { StaticBlogIndex } from "./staticSiteData";

export type BlogArticleNavigationInput = {
  currentRangeStart: number | null;
  currentSourceFile: string | null | undefined;
  direction: -1 | 1;
  document: OrgizeDocumentView | null;
  staticBlogIndex: StaticBlogIndex | null | undefined;
};

type BlogArticleCandidate = {
  rangeStart: number;
  sourceFile: string | null;
};

export const adjacentBlogArticleSelection = ({
  currentRangeStart,
  currentSourceFile,
  direction,
  document,
  staticBlogIndex,
}: BlogArticleNavigationInput): BlogArticleSelection | null => {
  const candidates = blogArticleNavigationCandidates(document, staticBlogIndex);
  if (candidates.length === 0) {
    return null;
  }
  const currentIndex = candidates.findIndex(
    (candidate) =>
      candidate.rangeStart === currentRangeStart &&
      (!candidate.sourceFile || candidate.sourceFile === currentSourceFile),
  );
  const fallbackIndex =
    currentIndex >= 0
      ? currentIndex
      : candidates.findIndex((candidate) => candidate.rangeStart === currentRangeStart);
  const nextIndex =
    fallbackIndex >= 0
      ? (fallbackIndex + direction + candidates.length) % candidates.length
      : direction > 0
        ? 0
        : candidates.length - 1;
  return candidates[nextIndex] ?? null;
};

const blogArticleNavigationCandidates = (
  document: OrgizeDocumentView | null,
  staticBlogIndex: StaticBlogIndex | null | undefined,
): BlogArticleCandidate[] => {
  if (staticBlogIndex?.articles.length) {
    return staticBlogIndex.articles.map((article) => ({
      rangeStart: article.rangeStart,
      sourceFile: article.sourceFile,
    }));
  }
  if (!document) {
    return [];
  }
  return blogTimelineArticles(document).map((article) => ({
    rangeStart: article.rangeStart,
    sourceFile: null,
  }));
};
