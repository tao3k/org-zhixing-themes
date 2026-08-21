export interface ThemeNavigationItem {
  children?: readonly ThemeNavigationItem[];
  description?: string;
  href?: string;
  name: string;
}

const isThemeNavigationItem = (value: unknown): value is ThemeNavigationItem => {
  if (
    typeof value !== "object" ||
    value === null ||
    typeof (value as ThemeNavigationItem).name !== "string" ||
    ((value as ThemeNavigationItem).description !== undefined &&
      typeof (value as ThemeNavigationItem).description !== "string")
  ) {
    return false;
  }

  const item = value as ThemeNavigationItem;
  return (
    typeof item.href === "string" ||
    (Array.isArray(item.children) &&
      item.children.length > 0 &&
      item.children.every(isThemeNavigationItem))
  );
};

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
