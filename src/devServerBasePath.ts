const normalizeBasePath = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "/") return "/";
  return `/${trimmed.replace(/^\/+|\/+$/g, "")}`;
};

export const devServerAssetPath = (pathname: string, basePath: string): string | null => {
  const normalizedBase = normalizeBasePath(basePath);
  if (normalizedBase === "/") return null;
  const prefix = `${normalizedBase}/`;
  if (!pathname.startsWith(prefix)) return null;
  const unprefixed = pathname.slice(normalizedBase.length);
  if (
    !/^\/(?:assets(?:\/|$)|org-zhixing\.static\.json$|org-zhixing\.toml$|favicon\.svg$)/u.test(
      unprefixed,
    )
  ) {
    return null;
  }
  return unprefixed;
};
