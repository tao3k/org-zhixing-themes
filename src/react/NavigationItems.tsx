import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import type { ContentShellData } from "../services/contentServices";
import { lifeFacetFor, routePathForView } from "./routeViewHelpers";
import { orgZhixingBasePath } from "../deploymentBasePath";

import { useThemeRuntime } from "../theme-system/react/ThemeRuntimeProvider";

import { resolveThemeNavigationHref, themeNavigationItemsFrom } from "../themeNavigation";
import type { ThemeNavigationItem } from "../themeNavigation";

function renderThemeNavigation(
  items: readonly ThemeNavigationItem[],
  onNavigate?: () => void,
): ReactNode[] {
  return items.flatMap((item) => {
    if (item.children?.length) {
      return (
        <details key={item.name} className="site-nav-group" data-theme-navigation-group={item.name}>
          <summary className="site-nav-group-label">
            <span>{item.name}</span>
            {item.description ? <small>{item.description}</small> : null}
          </summary>
          <div className="site-nav-group-items">
            {renderThemeNavigation(item.children, onNavigate)}
          </div>
        </details>
      );
    }

    if (!item.href) return [];

    return (
      <a
        key={item.href}
        href={resolveThemeNavigationHref(item.href, orgZhixingBasePath())}
        className="site-nav-item"
        data-theme-navigation-item={item.name}
        onClick={onNavigate}
      >
        <span>{item.name}</span>
        <small>{item.description}</small>
      </a>
    );
  });
}

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
      {renderThemeNavigation(themeNavigation, onNavigate)}
    </>
  );
}
