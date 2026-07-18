export const writeRouteShells: (options: {
  distRoot: string;
  hydrate?: boolean;
}) => Promise<void>;
export const injectInitialAppShell: (html: string) => string;
export const injectStaticRoutePage: (
  html: string,
  routeHtml: string,
  options?: {
    activeView: string;
    baseHref?: string;
    preserveApplicationScripts?: boolean;
    siteConfig?: unknown;
    staticData?: unknown;
  },
) => string;
export const injectImagePreload: (html: string, href: string) => string;
export const injectFetchPreloads: (html: string, hrefs: readonly string[]) => string;
export const escapeHtmlAttribute: (value: unknown) => string;
