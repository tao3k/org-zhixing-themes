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
  const workspaceThemes = snapshot.catalog.filter(
    (entry): entry is ThemeCatalogEntry & { transport: WorkspaceThemeTransport } =>
      entry.transport.kind === "workspace",
  );
  const federatedThemes = snapshot.catalog.filter(
    (entry): entry is ThemeCatalogEntry & { transport: FederatedThemeTransport } =>
      entry.transport.kind === "federated",
  );
  const selectedWorkspaceTheme = selected.transport.kind === "workspace" ? selected : null;
  const workspaceImports = selectedWorkspaceTheme
    ? [
        `import selectedWorkspaceTheme from ${JSON.stringify(selectedWorkspaceTheme.transport.module)};`,
      ]
    : [];
  const workspaceBindings = selectedWorkspaceTheme
    ? [`[${JSON.stringify(selectedWorkspaceTheme.id)}, selectedWorkspaceTheme]`]
    : [];
  const workspaceLoaderBindings = workspaceThemes
    .filter(({ id }) => id !== selected.id)
    .map(
      (entry) =>
        `[${JSON.stringify(entry.id)}, () => import(${JSON.stringify(entry.transport.module)}).then((themeModule) => themeModule.default ?? themeModule)]`,
    );
  const federationImports = federatedThemes.length
    ? [
        'import { createInstance } from "@module-federation/enhanced/runtime";',
        'import * as orgZhixingReact from "react";',
        'import * as orgZhixingReactDom from "react-dom";',
      ]
    : [];
  const remotes = [
    ...new Map(federatedThemes.map((entry) => [entry.transport.remoteName, entry])).values(),
  ];
  const federationBinding = federatedThemes.length
    ? [
        "const orgZhixingThemeFederation = createInstance({",
        `  name: ${JSON.stringify(`org_zhixing_host_${snapshot.instanceId.replace(/[^a-zA-Z0-9_]/g, "_")}`)},`,
        "  remotes: [",
        ...remotes.flatMap((entry) => [
          "    {",
          `      name: ${JSON.stringify(entry.transport.remoteName)},`,
          `      entry: ${JSON.stringify(entry.transport.entry)},`,
          "    },",
        ]),
        "  ],",
        "  shared: {",
        "    react: {",
        "      version: orgZhixingReact.version,",
        '      scope: "default",',
        "      lib: () => orgZhixingReact,",
        "      shareConfig: { singleton: true, requiredVersion: false },",
        "    },",
        '    "react-dom": {',
        "      version: orgZhixingReactDom.version,",
        '      scope: "default",',
        "      lib: () => orgZhixingReactDom,",
        "      shareConfig: { singleton: true, requiredVersion: false },",
        "    },",
        "  },",
        "});",
      ]
    : [];
  const federatedBindings = federatedThemes.map((entry) => [entry.id, entry.transport.module]);
  const runtimeCatalog = snapshot.catalog.map((entry) =>
    entry.id === selected.id
      ? entry
      : {
          ...entry,
          package: null,
          transport:
            entry.transport.kind === "workspace"
              ? { kind: "workspace" as const, module: `theme:${entry.id}` }
              : entry.transport,
        },
  );
  return [
    ...workspaceImports,
    ...federationImports,
    ...federationBinding,
    `export const themeIsolationId = ${JSON.stringify(snapshot.instanceId)};`,
    `export const isolatedSelectedThemeId = ${JSON.stringify(snapshot.selectedThemeId)};`,
    `export const isolatedSelectedVariant = ${JSON.stringify(snapshot.selectedVariant)};`,
    `export const isolatedSelectedThemeMetadata = ${JSON.stringify(selected)};`,
    `export const isolatedThemeCatalog = ${JSON.stringify(runtimeCatalog)};`,
    `const workspaceThemesById = new Map([${workspaceBindings.join(", ")}]);`,
    `const workspaceThemeLoadersById = new Map([${workspaceLoaderBindings.join(", ")}]);`,
    `const federatedThemeModulesById = new Map(${JSON.stringify(federatedBindings)});`,
    "const loadedThemesById = new Map();",
    "const loadingThemesById = new Map();",
    "const loadWorkspaceThemeById = (id, load) => {",
    "  const loaded = loadedThemesById.get(id);",
    "  if (loaded) return Promise.resolve(loaded);",
    "  const pending = loadingThemesById.get(id);",
    "  if (pending) return pending;",
    "  const loading = load().then((theme) => {",
    "    loadedThemesById.set(id, theme);",
    "    loadingThemesById.delete(id);",
    "    return theme;",
    "  }).catch((error) => {",
    "    loadingThemesById.delete(id);",
    "    throw error;",
    "  });",
    "  loadingThemesById.set(id, loading);",
    "  return loading;",
    "};",
    "const loadFederatedThemeById = (id, module) => {",
    "  const loaded = loadedThemesById.get(id);",
    "  if (loaded) return Promise.resolve(loaded);",
    "  const pending = loadingThemesById.get(id);",
    "  if (pending) return pending;",
    "  const loading = orgZhixingThemeFederation.loadRemote(module).then((federatedThemeExports) => {",
    "    const federatedThemeModule = federatedThemeExports?.default ?? federatedThemeExports;",
    `    if (federatedThemeModule?.protocol !== ${JSON.stringify(themeModuleProtocol)}) {`,
    '      throw new Error(`THEME-E033 federated theme "${id}" uses an unsupported module protocol`);',
    "    }",
    "    const theme = federatedThemeModule.theme;",
    "    loadedThemesById.set(id, theme);",
    "    return theme;",
    "  }).catch((error) => {",
    "    loadingThemesById.delete(id);",
    "    throw error;",
    "  });",
    "  loadingThemesById.set(id, loading);",
    "  return loading;",
    "};",
    "export const loadThemeById = (id) => {",
    "  const workspaceTheme = workspaceThemesById.get(id);",
    "  if (workspaceTheme) return Promise.resolve(workspaceTheme);",
    "  const workspaceThemeLoader = workspaceThemeLoadersById.get(id);",
    "  if (workspaceThemeLoader) return loadWorkspaceThemeById(id, workspaceThemeLoader);",
    "  const federatedModule = federatedThemeModulesById.get(id);",
    "  if (federatedModule) return loadFederatedThemeById(id, federatedModule);",
    '  return Promise.reject(new Error(`THEME-E001 unknown theme "${id}"`));',
    "};",
    "export const getIsolatedSelectedTheme = () => {",
    "  const workspaceTheme = workspaceThemesById.get(isolatedSelectedThemeId);",
    "  if (workspaceTheme) return workspaceTheme;",
    "  const loaded = loadedThemesById.get(isolatedSelectedThemeId);",
    "  if (loaded) return loaded;",
    '  throw new Error(`THEME-E035 federated theme "${isolatedSelectedThemeId}" has not finished loading`);',
    "};",
    "export const loadIsolatedSelectedTheme = () => loadThemeById(isolatedSelectedThemeId);",
  ].join("\n");
};
import { themeModuleProtocol } from "@org-zhixing/theme-contract";
