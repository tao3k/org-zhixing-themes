import type { QueryClient } from "@tanstack/react-query";
import { redirect } from "@tanstack/react-router";
import { renderThemeLayout, type ZhixingTheme } from "../library/theme";
import type { ViewKey } from "../model";
import type { ContentShellData } from "../services/contentServices";
import { loadStaticDocumentById } from "../services/staticDocumentById";
import {
  contentRoutesForShell,
  loadThemeDocument,
  themeOwnsContentRoutes,
} from "./themeContentRouting";

export type OrgZhixingRouterContext = {
  getQueryClient: () => Promise<QueryClient>;
  selectedTheme?: ZhixingTheme;
};

export async function loadContentShellQuery(
  context: OrgZhixingRouterContext,
): Promise<ContentShellData> {
  const queryClient = await context.getQueryClient();
  return queryClient.ensureQueryData({
    queryKey: ["org-zhixing", "content-shell"],
    queryFn: async () => {
      const { loadContentShellData } = await import("../services/contentServices");
      return loadContentShellData();
    },
  });
}

export async function loadGalleryQuery(
  context: OrgZhixingRouterContext,
): Promise<Awaited<ReturnType<typeof import("../staticSiteData").loadStaticGalleryData>>> {
  const queryClient = await context.getQueryClient();
  return queryClient.ensureQueryData({
    queryKey: ["org-zhixing", "gallery"],
    queryFn: async () => {
      const { loadStaticGalleryData } = await import("../staticSiteData");
      return loadStaticGalleryData();
    },
  });
}

export async function loadArticleQuery(
  context: OrgZhixingRouterContext,
  articleId: string,
): Promise<Awaited<ReturnType<typeof import("../services/contentServices").loadBlogArticleData>>> {
  const shell = await loadContentShellQuery(context);
  const queryClient = await context.getQueryClient();
  return queryClient.ensureQueryData({
    queryKey: ["org-zhixing", shell.staticSite?.generatedAt ?? "dynamic", "article", articleId],
    queryFn: async () => {
      const { loadBlogArticleData } = await import("../services/contentServices");
      return loadBlogArticleData(articleId, shell);
    },
  });
}

export async function loadNotesQuery(
  context: OrgZhixingRouterContext,
): Promise<Awaited<ReturnType<typeof import("../services/contentServices").loadSiteNotesData>>> {
  const shell = await loadContentShellQuery(context);
  const queryClient = await context.getQueryClient();
  return queryClient.ensureQueryData({
    queryKey: ["org-zhixing", shell.staticSite?.generatedAt ?? "dynamic", "notes"],
    queryFn: async () => {
      const { loadSiteNotesData } = await import("../services/contentServices");
      return loadSiteNotesData(shell);
    },
  });
}

export async function loadThemeDocumentQuery(context: OrgZhixingRouterContext, docId: string) {
  const shell = await loadContentShellQuery(context);
  const routes = contentRoutesForShell(shell, context.selectedTheme);

  if (routes != null) {
    return {
      kind: "contentRoutes" as const,
      routes,
      data: await loadThemeDocumentBindingQuery(context, docId),
    };
  }

  const document = await loadStaticDocumentById(shell, docId);
  const selectedTheme = context.selectedTheme;
  if (selectedTheme?.layouts?.page != null || selectedTheme?.layouts?.default != null) {
    const rendered = await renderThemeLayout(selectedTheme, "page", {
      site: shell.siteConfig,
      route: {
        kind: "page",
        path: `/${docId}`,
        sourceId: document.staticSource.id,
      },
      staticSite: shell.staticSite ?? null,
      source: document.staticSource,
      document: document.document,
      renderedHtml: document.html,
    });
    return { kind: "layout" as const, html: rendered.html, document };
  }

  return { kind: "static" as const, document };
}

async function loadThemeDocumentBindingQuery(context: OrgZhixingRouterContext, docId: string) {
  const shell = await loadContentShellQuery(context);
  const routes = contentRoutesForShell(shell, context.selectedTheme);
  if (!routes) throw redirect({ to: "/blogs" });
  return loadThemeDocument(shell, docId, await context.getQueryClient(), context.selectedTheme);
}

export async function redirectToThemeContentRoot({
  context,
}: {
  context: OrgZhixingRouterContext;
}) {
  if (themeOwnsContentRoutes(await loadContentShellQuery(context), context.selectedTheme)) {
    throw redirect({ to: "/" });
  }
}

export async function loadDocumentQuery(
  context: OrgZhixingRouterContext,
  view: ViewKey,
  options: Parameters<typeof import("../services/contentServices").loadStaticDocumentData>[1],
): Promise<
  Awaited<ReturnType<typeof import("../services/contentServices").loadStaticDocumentData>>
> {
  const shell = await loadContentShellQuery(context);
  const queryClient = await context.getQueryClient();
  return queryClient.ensureQueryData({
    queryKey: [
      "org-zhixing",
      shell.staticSite?.generatedAt ?? "dynamic",
      "document",
      view,
      shell.initialSource.sourceFile,
    ],
    queryFn: async () => {
      const { loadStaticDocumentData } = await import("../services/contentServices");
      return loadStaticDocumentData(shell, options);
    },
  });
}
