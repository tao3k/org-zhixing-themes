import { publicAssetUrl, type SiteConfig } from "../config";
import type { OrgizeDocumentView, ViewKey } from "../model";
import { renderView, type RenderViewOptions } from "../render";
import type { StaticSiteData, StaticSource } from "../staticSiteData";
import type { ThemePackageManifest } from "./themeManifest";
import type { ThemeVariant } from "./themeTokens";

export type ThemeRouteKind = "index" | "page" | "post" | "section" | "notFound";

export type ThemeRoute = {
  kind: ThemeRouteKind;
  path: string;
  view?: ViewKey;
  sourceId?: string;
  rangeStart?: number;
};

export type ThemeAssetKind = "style" | "script" | "image" | "font" | "other";

export type ThemeAsset = {
  path: string;
  kind: ThemeAssetKind;
};

export type ThemeAssetManifest = {
  assets: ThemeAsset[];
  entrypoints?: Record<string, string[]>;
};

export type ThemeContext = {
  site: SiteConfig;
  route: ThemeRoute;
  staticSite?: StaticSiteData | null;
  source?: StaticSource | null;
  document?: OrgizeDocumentView | null;
  renderedHtml?: string;
};

export type ThemeRenderResult =
  | string
  | {
      html: string;
      assets?: ThemeAssetManifest;
      status?: number;
    };

export type NormalizedThemeRenderResult = {
  html: string;
  assets?: ThemeAssetManifest;
  status: number;
};

export type ThemeApi = {
  renderView(options: RenderViewOptions): string;
  publicAssetUrl(path: string): URL;
};

export type ThemeLayout<TContext extends ThemeContext = ThemeContext> = (
  context: TContext,
  api: ThemeApi,
) => ThemeRenderResult | Promise<ThemeRenderResult>;

export type ThemeLayouts = Partial<Record<ThemeRouteKind, ThemeLayout>> & {
  default?: ThemeLayout;
};

export type ZhixingTheme = {
  name: string;
  version?: string;
  layouts: ThemeLayouts;
  assets?: ThemeAssetManifest;
  extendConfig?: (config: SiteConfig) => SiteConfig;
  manifest?: ThemePackageManifest;
  variants?: readonly ThemeVariant[];
  rendererBindings?: Readonly<Record<string, unknown>>;
};

export const defineTheme = <TTheme extends ZhixingTheme>(theme: TTheme): TTheme => theme;

export const createDefaultThemeApi = (): ThemeApi => ({
  renderView,
  publicAssetUrl,
});

export const renderThemeLayout = async (
  theme: ZhixingTheme,
  routeKind: ThemeRouteKind,
  context: ThemeContext,
  api: ThemeApi = createDefaultThemeApi(),
): Promise<NormalizedThemeRenderResult> => {
  const layout = theme.layouts[routeKind] ?? theme.layouts.default;
  if (!layout) {
    throw new Error(`theme "${theme.name}" does not define a "${routeKind}" layout`);
  }
  return withThemeAssets(theme, normalizeThemeRenderResult(await layout(context, api)));
};

export const normalizeThemeRenderResult = (
  result: ThemeRenderResult,
): NormalizedThemeRenderResult =>
  typeof result === "string" ? { html: result, status: 200 } : { status: 200, ...result };

const withThemeAssets = (
  theme: ZhixingTheme,
  result: NormalizedThemeRenderResult,
): NormalizedThemeRenderResult => {
  if (!theme.assets) {
    return result;
  }
  return {
    ...result,
    assets: mergeThemeAssetManifests(theme.assets, result.assets),
  };
};

const mergeThemeAssetManifests = (
  themeAssets: ThemeAssetManifest,
  layoutAssets?: ThemeAssetManifest,
): ThemeAssetManifest => ({
  assets: [...themeAssets.assets, ...(layoutAssets?.assets ?? [])],
  entrypoints:
    themeAssets.entrypoints || layoutAssets?.entrypoints
      ? {
          ...themeAssets.entrypoints,
          ...layoutAssets?.entrypoints,
        }
      : undefined,
});
