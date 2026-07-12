import type { SiteConfig } from "../config";
import type { ZhixingTheme } from "./theme";
import { themePackageManifestFor } from "./themePackage";

export type ThemeRegistry = ReadonlyMap<string, ZhixingTheme>;

export const createThemeRegistry = (themes: readonly ZhixingTheme[] = []): ThemeRegistry => {
  let registry = new Map<string, ZhixingTheme>();
  for (const theme of themes) {
    registry = mutableRegisterTheme(registry, theme);
  }
  return registry;
};

export const registerTheme = (registry: ThemeRegistry, theme: ZhixingTheme): ThemeRegistry =>
  mutableRegisterTheme(new Map(registry), theme);

export const resolveTheme = (registry: ThemeRegistry, name: string): ZhixingTheme => {
  const theme = registry.get(name);
  if (!theme) {
    const available = themeNames(registry);
    throw new Error(
      `THEME-E001 unknown theme "${name}"${available.length > 0 ? `; available: ${available.join(", ")}` : ""}`,
    );
  }
  return theme;
};

export const resolveConfiguredTheme = (registry: ThemeRegistry, config: SiteConfig): ZhixingTheme =>
  validateConfiguredVariant(resolveTheme(registry, config.theme.id), config.theme.variant);

export const themeNames = (registry: ThemeRegistry): string[] => [...registry.keys()].sort();

export const applyThemeConfig = (theme: ZhixingTheme, config: SiteConfig): SiteConfig =>
  theme.extendConfig ? theme.extendConfig(config) : config;

const mutableRegisterTheme = (
  registry: Map<string, ZhixingTheme>,
  theme: ZhixingTheme,
): Map<string, ZhixingTheme> => {
  if (!theme.name.trim()) {
    throw new Error("theme name must not be empty");
  }
  if (registry.has(theme.name)) {
    throw new Error(`THEME-E002 duplicate theme id "${theme.name}"`);
  }
  registry.set(theme.name, theme);
  return registry;
};

const validateConfiguredVariant = (theme: ZhixingTheme, variant: string): ZhixingTheme => {
  const variants = themePackageManifestFor(theme).variants;
  if (!variants.includes(variant)) {
    throw new Error(
      `THEME-E005 unknown variant "${variant}" for theme "${theme.name}"; available: ${variants.join(", ")}`,
    );
  }
  return theme;
};
