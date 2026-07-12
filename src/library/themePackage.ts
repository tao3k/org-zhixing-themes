import type { SiteConfig } from "../config";
import { defineTheme, type ThemeLayouts, type ZhixingTheme } from "./theme";
import type { ThemePackageManifest } from "./themeManifest";
import type { ThemeVariant } from "./themeTokens";
import { validateThemeSlotManifest } from "./themeSlots";

export type { ThemePackageManifest, ThemeRendererManifest } from "./themeManifest";

export type ThemePackageDefinition = {
  manifest: ThemePackageManifest;
  layouts: ThemeLayouts;
  variants: readonly ThemeVariant[];
  rendererBindings?: Readonly<Record<string, unknown>>;
  extendConfig?: (config: SiteConfig) => SiteConfig;
};

export const defineThemePackage = (definition: ThemePackageDefinition): ZhixingTheme => {
  const manifest = normalizeThemePackageManifest(definition.manifest);
  const variantIds = definition.variants.map((variant) => variant.id);
  if (
    variantIds.length !== manifest.variants.length ||
    manifest.variants.some((variant) => !variantIds.includes(variant))
  ) {
    throw new Error(
      `THEME-E005 theme "${manifest.id}" runtime variants must match its package manifest`,
    );
  }
  return defineTheme({
    name: manifest.id,
    version: manifest.version,
    layouts: definition.layouts,
    assets: manifest.assets,
    extendConfig: definition.extendConfig,
    manifest,
    variants: definition.variants,
    rendererBindings: definition.rendererBindings,
  });
};

export const normalizeThemePackageManifest = (
  manifest: ThemePackageManifest,
): ThemePackageManifest => {
  if (manifest.schemaVersion !== 1) {
    throw new Error(`unsupported theme manifest schema version: ${manifest.schemaVersion}`);
  }
  const id = requiredString(manifest.id, "theme manifest id");
  const engine = requiredString(manifest.engine, "theme manifest engine");
  const defaultVariant = requiredString(manifest.defaultVariant, "theme manifest default variant");
  const variants = stringList(manifest.variants, "theme manifest variants");
  if (!variants.includes(defaultVariant)) {
    throw new Error(`theme manifest default variant "${defaultVariant}" is not declared`);
  }
  const renderers = Object.fromEntries(
    Object.entries(manifest.renderers).map(([name, renderer]) => [
      requiredString(name, "theme renderer name"),
      { ...renderer, export: requiredString(renderer.export, `theme renderer "${name}" export`) },
    ]),
  );
  if (Object.keys(renderers).length === 0) {
    throw new Error("theme manifest must declare at least one renderer");
  }
  return {
    ...manifest,
    id,
    package: manifest.package?.trim() || null,
    engine,
    defaultVariant,
    variants,
    capabilities: stringList(manifest.capabilities, "theme manifest capabilities"),
    publicSlots: manifest.publicSlots.map(validateThemeSlotManifest),
    renderers,
    renderModes: stringList(manifest.renderModes, "theme manifest render modes"),
  };
};

export const themePackageManifestFor = (theme: ZhixingTheme): ThemePackageManifest => {
  if (theme.manifest) {
    return normalizeThemePackageManifest(theme.manifest);
  }
  return normalizeThemePackageManifest({
    schemaVersion: 1,
    id: theme.name,
    package: null,
    version: theme.version,
    engine: "*",
    defaultVariant: "default",
    variants: ["default"],
    capabilities: [],
    publicSlots: [],
    renderers: { library: { export: "." } },
    renderModes: ["static"],
    assets: theme.assets,
  });
};

const requiredString = (value: string, label: string): string => {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} must not be empty`);
  return normalized;
};

const stringList = (values: readonly string[], label: string): string[] =>
  values.map((value) => requiredString(value, label));
