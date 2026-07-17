export interface ThemeNavigationItem {
  description?: string;
  href: string;
  name: string;
}

const isThemeNavigationItem = (value: unknown): value is ThemeNavigationItem =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as ThemeNavigationItem).href === "string" &&
  typeof (value as ThemeNavigationItem).name === "string" &&
  ((value as ThemeNavigationItem).description === undefined ||
    typeof (value as ThemeNavigationItem).description === "string");

export const themeNavigationItemsFrom = (
  rendererBindings: Readonly<Record<string, unknown>> | undefined,
): readonly ThemeNavigationItem[] => {
  const navigation = rendererBindings?.navigation;
  return Array.isArray(navigation) ? navigation.filter(isThemeNavigationItem) : [];
};

export const resolveThemeNavigationHref = (href: string, publicPath: string): string => {
  if (/^(?:[a-z]+:)?\/\//iu.test(href) || href.startsWith("/")) return href;
  const base = publicPath.endsWith("/") ? publicPath : `${publicPath}/`;
  return `${base}${href.replace(/^\.\//u, "")}`;
};
