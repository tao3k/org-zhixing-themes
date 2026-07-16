export const themeRuntimeModuleId = "virtual:org-zhixing/theme-runtime";
export const resolvedThemeRuntimeModuleId = `\0${themeRuntimeModuleId}`;

export type WorkspaceThemeTransport = {
  readonly kind: "workspace";
  readonly module: string;
};

export type FederatedThemeTransport = {
  readonly kind: "federated";
  readonly module: string;
  readonly remoteName: string;
  readonly entry: string;
  readonly exposedModule: `./${string}`;
};

export type ThemeModuleTransport = WorkspaceThemeTransport | FederatedThemeTransport;

export type ThemeCatalogEntry = {
  readonly id: string;
  readonly package: string | null;
  readonly defaultVariant: string;
  readonly variants: readonly string[];
  readonly transport: ThemeModuleTransport;
};

export type ThemeIsolationSnapshot = {
  readonly instanceId: string;
  readonly selectedThemeId: string;
  readonly selectedVariant: string;
  readonly catalog: readonly ThemeCatalogEntry[];
  readonly watchFiles: readonly string[];
};

export const defineThemeIsolationSnapshot = (
  snapshot: ThemeIsolationSnapshot,
): ThemeIsolationSnapshot => {
  const catalog = [...snapshot.catalog].sort((left, right) => left.id.localeCompare(right.id));
  const duplicate = catalog.find((theme, index) => theme.id === catalog[index - 1]?.id);
  if (duplicate) {
    throw new Error(`THEME-E002 duplicate theme id "${duplicate.id}"`);
  }
  const selected = catalog.find((theme) => theme.id === snapshot.selectedThemeId);
  if (!selected) {
    throw new Error(
      `THEME-E001 unknown theme "${snapshot.selectedThemeId}"; available: ${catalog.map(({ id }) => id).join(", ")}`,
    );
  }
  if (!selected.variants.includes(snapshot.selectedVariant)) {
    throw new Error(
      `THEME-E005 unknown variant "${snapshot.selectedVariant}" for theme "${selected.id}"; available: ${selected.variants.join(", ")}`,
    );
  }
  return Object.freeze({
    ...snapshot,
    catalog: Object.freeze(
      catalog.map((theme) =>
        Object.freeze({
          ...theme,
          variants: Object.freeze([...theme.variants]),
        }),
      ),
    ),
    watchFiles: Object.freeze([...new Set(snapshot.watchFiles)]),
  });
};

export const renderThemeRuntimeModule = (snapshot: ThemeIsolationSnapshot): string => {
  const selected = snapshot.catalog.find(({ id }) => id === snapshot.selectedThemeId);
  if (!selected) {
    throw new Error(`THEME-E001 isolation snapshot "${snapshot.instanceId}" is inconsistent`);
  }
  const moduleBinding =
    selected.transport.kind === "workspace"
      ? [`import isolatedSelectedTheme from ${JSON.stringify(selected.transport.module)};`]
      : [
          `import federatedThemeModule from ${JSON.stringify(selected.transport.module)};`,
          `if (federatedThemeModule?.protocol !== ${JSON.stringify(themeModuleProtocol)}) {`,
          `  throw new Error(${JSON.stringify(`THEME-E033 federated theme "${selected.id}" uses an unsupported module protocol`)});`,
          "}",
          "const isolatedSelectedTheme = federatedThemeModule.theme;",
        ];
  return [
    ...moduleBinding,
    `export const themeIsolationId = ${JSON.stringify(snapshot.instanceId)};`,
    `export const isolatedSelectedThemeId = ${JSON.stringify(snapshot.selectedThemeId)};`,
    `export const isolatedSelectedVariant = ${JSON.stringify(snapshot.selectedVariant)};`,
    `export const isolatedSelectedThemeMetadata = ${JSON.stringify(selected)};`,
    `export const isolatedThemeCatalog = ${JSON.stringify(snapshot.catalog)};`,
    "export { isolatedSelectedTheme };",
    "export const isolatedThemes = [isolatedSelectedTheme];",
    `export const isolatedThemeEntries = [[${JSON.stringify(selected.id)}, isolatedSelectedTheme]];`,
  ].join("\n");
};
import { themeModuleProtocol } from "@org-zhixing/theme-contract";
