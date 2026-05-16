import { blogArticles, type OrgizeDocumentView, type ViewKey } from "./model";

export type BlogReaderState = {
  articleRangeStart: number | null;
  zenMode: boolean;
};

export const initialBlogReaderState = (): BlogReaderState => ({
  articleRangeStart: initialArticleRangeStart(),
  zenMode: initialZenMode(),
});

export const readerModeFor = (view: ViewKey, state: BlogReaderState): "library" | "zen" =>
  view === "blog" && state.zenMode ? "zen" : "library";

export const blogCacheKey = (state: BlogReaderState): string =>
  `blog:${state.articleRangeStart ?? ""}:${state.zenMode ? "zen" : "library"}`;

export const syncBlogArticleSelection = (
  document: OrgizeDocumentView | null,
  state: BlogReaderState,
): void => {
  const articles = blogArticles(document);
  if (articles.length === 0) {
    state.articleRangeStart = null;
    return;
  }
  if (!articles.some((article) => article.rangeStart === state.articleRangeStart)) {
    state.articleRangeStart = articles[0].rangeStart;
  }
};

export const clearBlogCache = (cache: Map<string, string>): void => {
  for (const key of cache.keys()) {
    if (key === "blog" || key.startsWith("blog:")) {
      cache.delete(key);
    }
  }
};

export const blogArticleFromEvent = (event: Event): number | null => {
  const target = (event.target as HTMLElement).closest<HTMLButtonElement>(
    "button[data-blog-article]",
  );
  const rangeStart = Number(target?.dataset.blogArticle);
  return target && Number.isSafeInteger(rangeStart) ? rangeStart : null;
};

export const blogZenModeFromEvent = (event: Event): boolean | null => {
  const target = (event.target as HTMLElement).closest<HTMLButtonElement>("button[data-blog-zen]");
  return target ? target.dataset.blogZen === "1" : null;
};

const initialArticleRangeStart = (): number | null => {
  const value = new URLSearchParams(window.location.search).get("article");
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
};

const initialZenMode = (): boolean => {
  const value = new URLSearchParams(window.location.search).get("zen");
  return value === "1" || value === "true" || value === "zen";
};
