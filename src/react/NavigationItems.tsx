import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import type { ContentShellData } from "../services/contentServices";
import { lifeFacetFor, routePathForView } from "./routeViewHelpers";

import { useThemeRuntime } from "../theme-system/react/ThemeRuntimeProvider";

import { resolveThemeNavigationHref, themeNavigationItemsFrom } from "../themeNavigation";

declare const __webpack_public_path__: string;

export function NavigationItems({
  shell,
  onNavigate,
}: {
  shell: ContentShellData;
  onNavigate?: () => void;
}): ReactNode {
  const { selectedTheme } = useThemeRuntime();
  const themeNavigation = themeNavigationItemsFrom(selectedTheme.rendererBindings);

  return (
    <>
      {shell.siteConfig.menu.map((item) => (
        <Link
          key={item.view}
          to={routePathForView(item.view)}
          className="site-nav-item"
          activeProps={{ className: "site-nav-item active" }}
          onClick={onNavigate}
        >
          <span>{item.name}</span>
          <small>{lifeFacetFor(item.view)}</small>
        </Link>
      ))}
      {themeNavigation.map((item) => (
        <a
          key={item.href}
          href={resolveThemeNavigationHref(item.href, __webpack_public_path__)}
          className="site-nav-item"
          onClick={onNavigate}
        >
          <span>{item.name}</span>
          <small>{item.description}</small>
        </a>
      ))}
    </>
  );
}
