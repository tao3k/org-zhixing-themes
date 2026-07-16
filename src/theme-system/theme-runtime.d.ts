declare module "virtual:org-zhixing/theme-runtime" {
  import type { ZhixingTheme } from "../library/theme";
  import type { ThemeCatalogEntry } from "./isolation";

  export const themeIsolationId: string;
  export const isolatedSelectedThemeId: string;
  export const isolatedSelectedVariant: string;
  export const isolatedSelectedThemeMetadata: ThemeCatalogEntry;
  export const isolatedThemeCatalog: readonly ThemeCatalogEntry[];
  export const isolatedSelectedTheme: ZhixingTheme;
  export const isolatedThemes: readonly ZhixingTheme[];
  export const isolatedThemeEntries: readonly (readonly [string, ZhixingTheme])[];
}
