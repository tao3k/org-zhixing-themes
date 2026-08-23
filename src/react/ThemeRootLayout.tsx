import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation } from "@tanstack/react-router";
import type { ContentShellData } from "../services/contentServices";
import { applyThemeVariant, createDefaultThemeRegistry, resolveConfiguredTheme } from "../library";
import type { ZhixingTheme } from "../library";
import { ShellChrome } from "./ShellChrome";
import { loadThemeVariantPreference, storeThemeVariantPreference } from "./themeVariantPreference";
import { viewForPath } from "./routeViewHelpers";
import { themeShowsSiteHeroOnContentRoutes } from "./themeContentRouting";

export const shouldShowSiteHero = (
  pathname: string,
  shell: ContentShellData,
  selectedTheme: ZhixingTheme,
): boolean =>
  pathname === "/" ||
  pathname === "/blogs" ||
  themeShowsSiteHeroOnContentRoutes(shell, selectedTheme);

export function ThemeRootLayout({
  children,
  shell,
  theme,
  defaultVariant,
}: {
  children: ReactNode;
  shell: ContentShellData;
  theme?: ZhixingTheme;
  defaultVariant?: string;
}): ReactNode {
  const location = useLocation();
  const routeZen = location.pathname.startsWith("/blogs/");
  const [immersiveZen, setImmersiveZen] = useState(false);
  const readerMode = routeZen || immersiveZen ? "zen" : "library";
  const view = viewForPath(location.pathname);
  const configuredTheme = useMemo(
    () => resolveConfiguredTheme(createDefaultThemeRegistry(), shell.siteConfig),
    [shell.siteConfig],
  );
  const selectedTheme = theme ?? configuredTheme;
  const selectedDefaultVariant = defaultVariant ?? shell.siteConfig.theme.variant;
  const showSiteHero = shouldShowSiteHero(location.pathname, shell, selectedTheme);
  const [activeVariantId, setActiveVariantId] = useState(() =>
    loadThemeVariantPreference(selectedTheme, selectedDefaultVariant),
  );
  useEffect(() => {
    applyThemeVariant(selectedTheme, activeVariantId);
    storeThemeVariantPreference(selectedTheme.name, activeVariantId);
    document.documentElement.lang = shell.siteConfig.locale;
    document.title = shell.siteConfig.title;
    const app = document.querySelector<HTMLElement>("#app");
    if (app) {
      app.dataset.view = view;
      app.dataset.readerMode = readerMode;
    }
  }, [activeVariantId, readerMode, selectedTheme, shell.siteConfig, view]);
  return (
    <ShellChrome
      activeVariantId={activeVariantId}
      onVariantChange={setActiveVariantId}
      onEnterZen={() => setImmersiveZen(true)}
      onExitZen={immersiveZen ? () => setImmersiveZen(false) : undefined}
      readerMode={readerMode}
      showSiteHero={showSiteHero}
      shell={shell}
      theme={selectedTheme}
    >
      {children}
    </ShellChrome>
  );
}
