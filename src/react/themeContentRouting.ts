import type { QueryClient } from "@tanstack/react-query";
import type { ContentShellData } from "../services/contentServices";
import { createDefaultThemeRegistry, resolveConfiguredTheme } from "../library";
import { reactSpaContentRoutes } from "./themeBinding";

export const contentRoutesForShell = (shell: ContentShellData) =>
  reactSpaContentRoutes(resolveConfiguredTheme(createDefaultThemeRegistry(), shell.siteConfig));

export const themeOwnsContentRoutes = (shell: ContentShellData): boolean =>
  contentRoutesForShell(shell)?.exclusiveContentRoutes === true;

export const loadThemeDocument = (
  shell: ContentShellData,
  documentId: string,
  queryClient: QueryClient,
): Promise<unknown> => {
  const routes = contentRoutesForShell(shell);
  if (!routes) return Promise.reject(new Error("THEME-E012 selected theme has no content routes"));
  return queryClient.ensureQueryData({
    queryKey: ["org-zhixing", shell.staticSite?.generatedAt ?? "dynamic", "document", documentId],
    queryFn: () => routes.loadDocument(shell, documentId),
  });
};
