import {
  Navigate,
  Outlet,
  createRootRouteWithContext,
  createRoute,
  createRouter,
  useNavigate,
} from "@tanstack/react-router";
import type { MouseEventHandler, ReactNode } from "react";
import { lazy, useEffect, useMemo, useState } from "react";
import { adjacentBlogArticleSelection } from "../blogNavigation";
import type { AgendaPanelKey } from "../agendaTypes";
import { isAgendaMode, isAgendaPanel } from "../agendaState";
import { renderAppView as renderView } from "../appViewRender";
import { renderThemeLayout } from "../library/theme";
import { useThemeRuntime } from "../theme-system/react/ThemeRuntimeProvider";
import { travelViewFromStaticSite } from "../travelSiteProjection";
import { isEditableTarget, viewDomNodes } from "./routeViewHelpers";
import { getReactQueryClient } from "./queryClient";
import { orgZhixingBasePath } from "./deploymentBasePath";
import { createAgendaSurfaceClickHandler } from "./agendaSurfaceNavigation";
import { HtmlSurface } from "./HtmlSurface";
import { RoutedHtmlSurface } from "./RoutedHtmlSurface";
import { renderReactSpaThemeSlot } from "./themeBinding";
import { ThemeRootLayout } from "./ThemeRootLayout";
import { contentRoutesForShell } from "./themeContentRouting";
import {
  loadArticleQuery,
  loadContentShellQuery,
  loadDocumentQuery,
  loadGalleryQuery,
  loadNotesQuery,
  loadThemeDocumentQuery,
  redirectToThemeContentRoot,
  type OrgZhixingRouterContext,
} from "./routerLoaders";
export type { OrgZhixingRouterContext } from "./routerLoaders";

const rootRoute = createRootRouteWithContext<OrgZhixingRouterContext>()({
  component: RootLayout,
  loader: ({ context }) => loadContentShellQuery(context),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const blogsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/blogs",
  component: BlogIndexPage,
  beforeLoad: redirectToThemeContentRoot,
  validateSearch: (search: Record<string, unknown>) => search,
});

const blogArticleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/blogs/$articleId",
  component: BlogArticlePage,
  beforeLoad: redirectToThemeContentRoot,
  loader: ({ context, params }) => loadArticleQuery(context, params.articleId),
  validateSearch: (search: Record<string, unknown>) => search,
});

const GalleryPage = lazy(() => import(/* webpackChunkName: "route-gallery" */ "./GalleryPage"));

export const galleryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/gallery",
  component: GalleryPage,
  loader: ({ context }) => loadGalleryQuery(context),
});
const notesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/notes",
  component: NotesPage,
  loader: ({ context }) => loadNotesQuery(context),
});
const travelRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/travel",
  component: TravelPage,
});
const memoryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/memory",
  component: MemoryPage,
  loader: ({ context }) =>
    loadDocumentQuery(context, "memory", {
      attachmentInventory: true,
      memory: true,
      sectionIndex: true,
    }),
});
const agendaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/agenda",
  component: AgendaPage,
  loader: ({ context }) => loadDocumentQuery(context, "agenda", { agenda: true }),
  validateSearch: (search: Record<string, unknown>) => search,
});
const captureRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/capture",
  component: CapturePage,
  loader: ({ context }) => loadDocumentQuery(context, "capture", {}),
});
const diagnosticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/diagnostics",
  component: DiagnosticsPage,
  loader: ({ context }) => loadDocumentQuery(context, "diagnostics", {}),
});

const themeDocumentRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/$docId",
  component: ThemeDocumentPage,
  loader: ({ context, params }) => loadThemeDocumentQuery(context, params.docId),
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  blogsRoute,
  blogArticleRoute,
  galleryRoute,
  notesRoute,
  travelRoute,
  memoryRoute,
  agendaRoute,
  captureRoute,
  diagnosticsRoute,
  themeDocumentRoute,
]);

export const createOrgZhixingRouter = (
  context: OrgZhixingRouterContext = {
    getQueryClient: getReactQueryClient,
  },
): ReturnType<typeof createRouter> =>
  createRouter({
    basepath: orgZhixingBasePath(),
    context,
    defaultPreload: "intent",
    routeTree,
  });

export const router = createOrgZhixingRouter();

function RootLayout(): ReactNode {
  return (
    <ThemeRootLayout shell={rootRoute.useLoaderData()}>
      <Outlet />
    </ThemeRootLayout>
  );
}

function HomePage(): ReactNode {
  const shell = rootRoute.useLoaderData();
  const context = rootRoute.useRouteContext();
  return (
    contentRoutesForShell(shell, context.selectedTheme)?.renderHome(shell) ?? (
      <Navigate replace to="/blogs" />
    )
  );
}

function ThemeDocumentPage(): ReactNode {
  const data = themeDocumentRoute.useLoaderData();
  if (data.kind === "contentRoutes") {
    return data.routes.renderDocument(data.data);
  }
  if (data.kind === "layout") {
    return <RoutedHtmlSurface html={data.html} />;
  }
  return <RoutedHtmlSurface html={data.document.html} />;
}

function BlogIndexPage(): ReactNode {
  const shell = rootRoute.useLoaderData();
  const { selectedTheme } = useThemeRuntime();
  const search = blogsRoute.useSearch() as { tag?: string; time?: string };
  const navigate = useNavigate();
  const html = useMemo(
    () =>
      renderView({
        view: "blog",
        document: null,
        blogIndex: shell.staticSite?.blog ?? null,
        blogTagFilter: search.tag ?? null,
        blogTimeFilter: search.time ?? null,
        blogZenMode: false,
      }),
    [search.tag, search.time, shell.staticSite?.blog],
  );
  const supportsIndexLayout = selectedTheme.layouts?.index != null;
  const [themedHtml, setThemedHtml] = useState<string | null>(null);
  useEffect(() => {
    if (!supportsIndexLayout) {
      setThemedHtml(null);
      return;
    }
    const controller = new AbortController();
    setThemedHtml(null);
    void renderThemeLayout(selectedTheme, "index", {
      site: shell.siteConfig,
      route: { kind: "index", path: "/blogs", view: "blog" },
      staticSite: shell.staticSite ?? null,
      document: null,
    })
      .then(({ html: layoutHtml }) => {
        if (!controller.signal.aborted) {
          setThemedHtml(layoutHtml);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setThemedHtml(html);
        }
      });
    return () => controller.abort();
  }, [html, selectedTheme, shell.siteConfig, shell.staticSite, supportsIndexLayout]);
  const surfaceHtml = supportsIndexLayout ? (themedHtml ?? "") : html;
  useEffect(() => {
    if (!surfaceHtml.includes("data-blog-virtual-list")) {
      return;
    }
    const controller = new AbortController();
    void import("../blogVirtualList").then(({ bindBlogVirtualList }) => {
      if (!controller.signal.aborted) {
        bindBlogVirtualList(viewDomNodes(), controller.signal);
      }
    });
    return () => controller.abort();
  }, [surfaceHtml]);
  const onClick: MouseEventHandler<HTMLDivElement> = (event) => {
    const target = (event.target as HTMLElement).closest<HTMLButtonElement>(
      "button[data-blog-article], button[data-blog-tag], button[data-blog-time]",
    );
    if (!target) {
      return;
    }
    event.preventDefault();
    if (target.dataset.blogArticle) {
      void navigate({
        params: { articleId: target.dataset.blogArticle },
        search: target.dataset.blogSource ? { source: target.dataset.blogSource } : {},
        to: "/blogs/$articleId",
      } as never);
      return;
    }
    if (target.dataset.blogTag !== undefined) {
      void navigate({
        search: {
          tag: target.dataset.blogTag || undefined,
          time: search.time,
        },
        to: "/blogs",
      } as never);
      return;
    }
    if (target.dataset.blogTime !== undefined) {
      void navigate({
        search: {
          tag: search.tag,
          time: target.dataset.blogTime || undefined,
        },
        to: "/blogs",
      } as never);
    }
  };
  return renderReactSpaThemeSlot(
    selectedTheme,
    "blog-index",
    { shell },
    <HtmlSurface html={surfaceHtml} onClick={onClick} />,
  );
}

function BlogArticlePage(): ReactNode {
  const shell = rootRoute.useLoaderData();
  const article = blogArticleRoute.useLoaderData();
  const navigate = useNavigate();
  const html = renderView({
    view: "blog",
    document: article.document,
    articleHtml: article.html,
    blogArticleRangeStart: article.article.rangeStart,
    blogIndex: shell.staticSite?.blog,
    blogZenMode: true,
    sourceFile: article.source.sourceFile,
  });

  useEffect(() => {
    const controller = new AbortController();
    void import("../blogZenProgress").then(({ bindBlogZenProgress }) => {
      if (!controller.signal.aborted) {
        bindBlogZenProgress(viewDomNodes(), controller.signal);
      }
    });
    return () => controller.abort();
  }, [html]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (isEditableTarget(event.target)) {
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        void navigate({ to: "/blogs" });
        return;
      }
      const direction =
        event.key === "ArrowRight" || event.key === "ArrowDown"
          ? 1
          : event.key === "ArrowLeft" || event.key === "ArrowUp"
            ? -1
            : 0;
      if (!direction) {
        return;
      }
      const selection = adjacentBlogArticleSelection({
        currentRangeStart: article.article.rangeStart,
        currentSourceFile: article.source.sourceFile,
        direction,
        document: article.document,
        staticBlogIndex: shell.staticSite?.blog,
      });
      if (!selection) {
        return;
      }
      event.preventDefault();
      void navigate({
        params: { articleId: String(selection.rangeStart) },
        search: selection.sourceFile ? { source: selection.sourceFile } : {},
        to: "/blogs/$articleId",
      } as never);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [article, navigate, shell.staticSite?.blog]);

  return <HtmlSurface html={html} />;
}

function TravelPage(): ReactNode {
  const shell = rootRoute.useLoaderData();
  const html = renderView({
    view: "travel",
    document: null,
    travelView: shell.staticSite ? travelViewFromStaticSite(shell.staticSite) : undefined,
  });
  useEffect(() => {
    const controller = new AbortController();
    void import("../travelGlance").then(
      ({ bindTravelGlance, scheduleTravelGlanceRuntimePrefetch, scheduleTravelIdleTask }) => {
        if (!controller.signal.aborted) {
          bindTravelGlance(viewDomNodes(), controller.signal);
          scheduleTravelGlanceRuntimePrefetch(controller.signal);
          if (html.includes("data-travel-virtual-list")) {
            scheduleTravelIdleTask(async () => {
              const { bindTravelVirtualList } = await import("../travelVirtualList");
              if (!controller.signal.aborted) {
                bindTravelVirtualList(viewDomNodes(), controller.signal);
              }
            }, controller.signal);
          }
        }
      },
    );
    return () => controller.abort();
  }, [html]);
  return <HtmlSurface html={html} />;
}

function NotesPage(): ReactNode {
  const notes = notesRoute.useLoaderData();
  return <HtmlSurface html={renderView({ view: "records", document: null, siteNotes: notes })} />;
}

function MemoryPage(): ReactNode {
  const data = memoryRoute.useLoaderData();
  return (
    <HtmlSurface
      html={renderView({
        view: "memory",
        document: data.document,
        articleHtml: data.html,
        sourceFile: data.source.sourceFile,
      })}
    />
  );
}

function AgendaPage(): ReactNode {
  const data = agendaRoute.useLoaderData();
  const search = agendaRoute.useSearch() as {
    agenda?: string;
    panel?: string;
    rule?: string;
  };
  const shell = rootRoute.useLoaderData();
  const navigate = useNavigate();
  const agendaMode = isAgendaMode(search.agenda) ? search.agenda : shell.siteConfig.agenda.mode;
  const agendaPanel: AgendaPanelKey = isAgendaPanel(search.panel) ? search.panel : "trace";
  const html = useMemo(
    () =>
      renderView({
        view: "agenda",
        document: data.document,
        agendaMode,
        agendaPanel,
        agendaRuleId: search.rule ?? null,
      }),
    [agendaMode, agendaPanel, data.document, search.rule],
  );
  const onClick = useMemo(
    () =>
      createAgendaSurfaceClickHandler({
        navigateToAgenda: (nextSearch) => {
          void navigate({
            search: nextSearch,
            to: "/agenda",
          } as never);
        },
        search,
      }),
    [navigate, search],
  );
  return <HtmlSurface html={html} onClick={onClick} />;
}

function CapturePage(): ReactNode {
  const data = captureRoute.useLoaderData();
  return <HtmlSurface html={renderView({ view: "capture", document: data.document })} />;
}

function DiagnosticsPage(): ReactNode {
  const data = diagnosticsRoute.useLoaderData();
  return <HtmlSurface html={renderView({ view: "diagnostics", document: data.document })} />;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
