import { blogArticles, type OrgizeDocumentView, type ViewKey } from "./model";

export type BlogReaderState = {
  articleRangeStart: number | null;
  tagFilter: string | null;
  timeFilter: string | null;
  zenMode: boolean;
};

export type BlogArticleSelection = {
  rangeStart: number;
  sourceFile: string | null;
};

export type BlogKeyboardAction = "exit" | "next" | "previous";

export const initialBlogReaderState = (): BlogReaderState => ({
  articleRangeStart: initialArticleRangeStart(),
  tagFilter: initialTextFilter("tag"),
  timeFilter: initialTextFilter("time"),
  zenMode: initialZenMode(),
});

export const readerModeFor = (view: ViewKey, state: BlogReaderState): "library" | "zen" =>
  view === "blog" && state.zenMode ? "zen" : "library";

export const blogCacheKey = (state: BlogReaderState): string =>
  [
    "blog",
    state.articleRangeStart ?? "",
    state.tagFilter ?? "",
    state.timeFilter ?? "",
    state.zenMode ? "zen" : "library",
  ].join(":");

export const syncBlogArticleSelection = (
  document: OrgizeDocumentView | null,
  state: BlogReaderState,
): void => {
  const articles = blogArticles(document);
  if (articles.length === 0) {
    state.articleRangeStart = null;
    return;
  }
  if (state.articleRangeStart === null && !state.zenMode) {
    return;
  }
  if (!articles.some((article) => article.rangeStart === state.articleRangeStart)) {
    state.articleRangeStart = state.zenMode ? articles[0].rangeStart : null;
  }
};

export const clearBlogCache = (cache: Map<string, string>): void => {
  for (const key of cache.keys()) {
    if (key === "blog" || key.startsWith("blog:")) {
      cache.delete(key);
    }
  }
};

export const blogArticleFromEvent = (event: Event): BlogArticleSelection | null => {
  const target = (event.target as HTMLElement).closest<HTMLButtonElement>(
    "button[data-blog-article]",
  );
  const rangeStart = Number(target?.dataset.blogArticle);
  return target && Number.isSafeInteger(rangeStart)
    ? { rangeStart, sourceFile: target.dataset.blogSource ?? null }
    : null;
};

export const blogZenModeFromEvent = (event: Event): boolean | null => {
  const target = (event.target as HTMLElement).closest<HTMLButtonElement>("button[data-blog-zen]");
  return target ? target.dataset.blogZen === "1" : null;
};

export const blogTagFilterFromEvent = (event: Event): string | null | undefined => {
  const target = (event.target as HTMLElement).closest<HTMLButtonElement>("button[data-blog-tag]");
  return target ? target.dataset.blogTag || null : undefined;
};

export const blogTimeFilterFromEvent = (event: Event): string | null | undefined => {
  const target = (event.target as HTMLElement).closest<HTMLButtonElement>("button[data-blog-time]");
  return target ? target.dataset.blogTime || null : undefined;
};

export const blogKeyboardActionFromEvent = (event: KeyboardEvent): BlogKeyboardAction | null => {
  if (isEditableTarget(event.target)) {
    return null;
  }
  switch (event.key) {
    case "Escape":
      return "exit";
    case "ArrowLeft":
    case "ArrowUp":
      return "previous";
    case "ArrowRight":
    case "ArrowDown":
      return "next";
    default:
      return null;
  }
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

const initialTextFilter = (key: string): string | null => {
  const value = new URLSearchParams(window.location.search).get(key)?.trim();
  return value ? value : null;
};

const isEditableTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  return Boolean(
    target.closest("input, textarea, select, button, [contenteditable='true'], [role='textbox']"),
  );
};
