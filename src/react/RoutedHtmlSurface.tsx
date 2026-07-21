import { useNavigate } from "@tanstack/react-router";
import {
  useCallback,
  useEffect,
  useRef,
  type MouseEvent,
  type MouseEventHandler,
  type ReactNode,
} from "react";
import { orgZhixingBasePath } from "./deploymentBasePath";
import { HtmlSurface } from "./HtmlSurface";
import { installOrgContentEnhancements } from "./orgContentEnhancements";

export type RawRoutedHtmlClickEvent = {
  activation: "primary" | "modified" | "non-primary";
  download: boolean;
  href: string;
  target: string | null;
};

export type RoutedHtmlInternalNavigation = {
  anchor: HTMLAnchorElement;
  target: string;
};

export const routedHtmlNavigationTarget = (
  click: RawRoutedHtmlClickEvent,
  currentHref: string,
  basePath = "/",
): string | null => {
  if (
    click.activation !== "primary" ||
    click.download ||
    (click.target !== null && click.target !== "" && click.target !== "_self") ||
    click.href.startsWith("#")
  ) {
    return null;
  }
  const current = new URL(currentHref);
  const destination = new URL(click.href, current);
  if (
    destination.origin !== current.origin ||
    !["http:", "https:"].includes(destination.protocol) ||
    (destination.pathname === current.pathname &&
      destination.search === current.search &&
      destination.hash.length > 0)
  ) {
    return null;
  }
  const normalizedBase = basePath === "/" ? "" : basePath.replace(/\/$/, "");
  const pathname =
    normalizedBase && destination.pathname.startsWith(`${normalizedBase}/`)
      ? destination.pathname.slice(normalizedBase.length)
      : destination.pathname;
  return `${pathname || "/"}${destination.search}${destination.hash}`;
};

export const routedAnchorNavigationFromEvent = (
  event: MouseEvent<HTMLElement>,
  currentHref: string,
  basePath = "/",
): RoutedHtmlInternalNavigation | null => {
  if (event.defaultPrevented) return null;
  const anchor = (event.target as Element | null)?.closest?.("a[href]");
  if (!(anchor instanceof HTMLAnchorElement)) return null;
  const target = routedHtmlNavigationTarget(
    {
      activation:
        event.button !== 0
          ? "non-primary"
          : event.altKey || event.ctrlKey || event.metaKey || event.shiftKey
            ? "modified"
            : "primary",
      download: anchor.hasAttribute("download"),
      href: anchor.getAttribute("href") ?? "",
      target: anchor.getAttribute("target"),
    },
    currentHref,
    basePath,
  );
  return target ? { anchor, target } : null;
};

export function RoutedHtmlSurface({
  html,
  onInternalNavigation,
}: {
  html: string;
  onInternalNavigation?: (navigation: RoutedHtmlInternalNavigation) => boolean;
}): ReactNode {
  const navigate = useNavigate();
  const surfaceRef = useRef<HTMLDivElement>(null);
  const internalNavigationRef = useRef(onInternalNavigation);
  useEffect(() => {
    internalNavigationRef.current = onInternalNavigation;
  }, [onInternalNavigation]);
  useEffect(() => {
    const root = surfaceRef.current;
    return root ? installOrgContentEnhancements(root) : undefined;
  }, [html]);
  const onClick = useCallback<MouseEventHandler<HTMLDivElement>>(
    (event) => {
      const navigation = routedAnchorNavigationFromEvent(
        event,
        window.location.href,
        orgZhixingBasePath(),
      );
      if (!navigation) return;
      event.preventDefault();
      if (internalNavigationRef.current?.(navigation)) return;
      void navigate({ to: navigation.target } as never);
    },
    [navigate],
  );
  return <HtmlSurface html={html} onClick={onClick} surfaceRef={surfaceRef} />;
}
