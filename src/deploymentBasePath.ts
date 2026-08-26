declare const __ORG_ZHIXING_BASE_PATH__: string | undefined;

export const orgZhixingBasePath = (): string => {
  const configured =
    typeof __ORG_ZHIXING_BASE_PATH__ === "string" ? __ORG_ZHIXING_BASE_PATH__ : "/";
  const normalized = normalizeOrgZhixingBasePath(configured);
  return normalized === "/" ? (runtimeAssetBasePath() ?? normalized) : normalized;
};

export const normalizeOrgZhixingBasePath = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "/") {
    return "/";
  }
  return `/${trimmed.replace(/^\/+|\/+$/g, "")}`;
};

/**
 * Dev and preview builds can load a nested SPA route before compile-time
 * defines are available to the client. Rsbuild's emitted asset URLs are the
 * canonical runtime authority for that base path.
 */
export const assetBasePathFromUrls = (urls: Iterable<string>): string | null => {
  for (const value of urls) {
    const pathname = new URL(value, window.location.origin).pathname;
    const assetsOffset = pathname.lastIndexOf("/assets/");
    if (assetsOffset <= 0) continue;
    return normalizeOrgZhixingBasePath(pathname.slice(0, assetsOffset));
  }
  return null;
};

const runtimeAssetBasePath = (): string | null => {
  if (typeof document === "undefined") return null;
  return assetBasePathFromUrls(
    [...document.scripts].map((script) => script.src).filter((source) => source.length > 0),
  );
};
