export const themeModuleProtocol = "org-zhixing/theme-module/v1" as const;

export type FederatedThemeManifest = {
  readonly schemaVersion: 1;
  readonly id: string;
  readonly engine: string;
  readonly defaultVariant: string;
  readonly variants: readonly string[];
  readonly capabilities: readonly string[];
  readonly renderers: Readonly<Record<string, { readonly export: string }>>;
  readonly renderModes: readonly string[];
};

export type FederatedZhixingTheme = {
  readonly name: string;
  readonly manifest: FederatedThemeManifest;
  readonly variants: readonly { readonly id: string; readonly [key: string]: unknown }[];
  readonly layouts: Readonly<Record<string, unknown>>;
  readonly rendererBindings?: Readonly<Record<string, unknown>>;
  readonly [key: string]: unknown;
};

export type FederatedThemeModule<TTheme extends FederatedZhixingTheme = FederatedZhixingTheme> = {
  readonly protocol: typeof themeModuleProtocol;
  readonly theme: TTheme;
};

export const defineFederatedThemeModule = <TTheme extends FederatedZhixingTheme>(
  theme: TTheme,
): FederatedThemeModule<TTheme> => {
  if (theme.name !== theme.manifest.id) {
    throw new Error(
      `THEME-E032 federated theme name "${theme.name}" does not match manifest id "${theme.manifest.id}"`,
    );
  }
  if (!theme.manifest.variants.includes(theme.manifest.defaultVariant)) {
    throw new Error(
      `THEME-E005 federated theme "${theme.name}" does not declare default variant "${theme.manifest.defaultVariant}"`,
    );
  }
  return Object.freeze({ protocol: themeModuleProtocol, theme });
};
