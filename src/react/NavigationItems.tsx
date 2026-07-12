import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import type { ContentShellData } from "../services/contentServices";
import { lifeFacetFor, routePathForView } from "./routeViewHelpers";

export function NavigationItems({
  shell,
  onNavigate,
}: {
  shell: ContentShellData;
  onNavigate?: () => void;
}): ReactNode {
  return shell.siteConfig.menu.map((item) => (
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
  ));
}
