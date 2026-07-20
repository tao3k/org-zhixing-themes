import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation } from "@tanstack/react-router";
import type { ContentShellData } from "../services/contentServices";
import { applyThemeVariant, createDefaultThemeRegistry, resolveConfiguredTheme } from "../library";
import { ShellChrome } from "./ShellChrome";
import { loadThemeVariantPreference, storeThemeVariantPreference } from "./themeVariantPreference";
import { viewForPath } from "./routeViewHelpers";

export function ThemeRootLayout({
  children,
  shell,
}: {
  children: ReactNode;
  shell: ContentShellData;
}): ReactNode {
  const location = useLocation();
  const routeZen = location.pathname.startsWith("/blogs/");
  const showSiteHero = location.pathname === "/" || location.pathname === "/blogs";
  const [immersiveZen, setImmersiveZen] = useState(false);
  const readerMode = routeZen || immersiveZen ? "zen" : "library";
  const view = viewForPath(location.pathname);
  const selectedTheme = useMemo(
    () => resolveConfiguredTheme(createDefaultThemeRegistry(), shell.siteConfig),
    [shell.siteConfig],
  );
  const [activeVariantId, setActiveVariantId] = useState(() =>
    loadThemeVariantPreference(selectedTheme, shell.siteConfig.theme.variant),
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
