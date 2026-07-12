import type { ThemeAssetManifest } from "./theme";
import type { ThemeSlotManifest } from "./themeSlots";

export type ThemeRendererManifest = {
  export: string;
  serverComponents?: boolean;
};

export type ThemePackageManifest = {
  schemaVersion: 1;
  id: string;
  package: string | null;
  version?: string;
  displayName?: string;
  engine: string;
  defaultVariant: string;
  variants: readonly string[];
  capabilities: readonly string[];
  publicSlots: readonly ThemeSlotManifest[];
  renderers: Readonly<Record<string, ThemeRendererManifest>>;
  renderModes: readonly string[];
  configSchema?: string;
  preview?: string;
  assets?: ThemeAssetManifest;
};
