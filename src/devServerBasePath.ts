const normalizeBasePath = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "/") return "/";
  return `/${trimmed.replace(/^\/+|\/+$/g, "")}`;
};

const rootStaticAssets = new Set(["favicon.svg", "zhixing-mark.svg"]);

const isStaticPublicPath = (pathname: string): boolean => {
  const relativePath = pathname.startsWith("/") ? pathname.slice(1) : pathname;
  const [root] = relativePath.split("/", 1);
  return (
    root === "assets" ||
    root === "attachments" ||
    root === "org-zhixing.toml" ||
    root.startsWith("org-zhixing.") ||
    rootStaticAssets.has(root)
  );
};

export const devServerAssetPath = (pathname: string, basePath: string): string | null => {
  const normalizedBase = normalizeBasePath(basePath);
  if (normalizedBase === "/") return null;
  const prefix = `${normalizedBase}/`;
  if (!pathname.startsWith(prefix)) return null;
  const unprefixed = pathname.slice(normalizedBase.length);
  return isStaticPublicPath(unprefixed) ? unprefixed : null;
};
