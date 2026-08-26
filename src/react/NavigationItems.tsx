import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { ContentShellData } from "../services/contentServices";
import { routePathForView } from "./routeViewHelpers";
import { orgZhixingBasePath } from "../deploymentBasePath";

import { useThemeRuntime } from "../theme-system/react/ThemeRuntimeProvider";

import { resolveThemeNavigationHref, themeNavigationItemsFrom } from "../themeNavigation";
import type { ThemeNavigationItem } from "../themeNavigation";

function renderThemeNavigation(
  items: readonly ThemeNavigationItem[],
  openGroup: string | null,
  onGroupToggle: (name: string) => void,
  groupTriggers: Map<string, HTMLElement>,
  onNavigate?: () => void,
): ReactNode[] {
  return items.flatMap((item) => {
    if (item.children?.length) {
      return (
        <details
          key={item.name}
          className="site-nav-group"
          data-theme-navigation-group={item.name}
          open={openGroup === item.name}
        >
          <summary
            className="site-nav-group-label"
            ref={(node) => {
              if (node) groupTriggers.set(item.name, node);
              else groupTriggers.delete(item.name);
            }}
            aria-expanded={openGroup === item.name}
            onClick={(event) => {
              event.preventDefault();
              onGroupToggle(item.name);
            }}
          >
            <span>{item.name}</span>
          </summary>
          <div className="site-nav-group-items">
            {renderThemeNavigation(
              item.children,
              openGroup,
              onGroupToggle,
              groupTriggers,
              onNavigate,
            )}
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
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const groupTriggers = useRef(new Map<string, HTMLElement>());

  useEffect(() => {
    if (!openGroup) return undefined;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if ((event.target as HTMLElement | null)?.closest("[data-theme-navigation-group]")) return;
      setOpenGroup(null);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      const trigger = groupTriggers.current.get(openGroup);
      setOpenGroup(null);
      trigger?.focus();
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [openGroup]);

  const closeNavigation = () => {
    setOpenGroup(null);
    onNavigate?.();
  };

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
        </Link>
      ))}
      {renderThemeNavigation(
        themeNavigation,
        openGroup,
        (name) => setOpenGroup((current) => (current === name ? null : name)),
        groupTriggers.current,
        closeNavigation,
      )}
    </>
  );
}
