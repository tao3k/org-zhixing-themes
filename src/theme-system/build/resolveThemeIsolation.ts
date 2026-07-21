import { readFile, readdir } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { parse } from "smol-toml";
import {
  defineThemeIsolationSnapshot,
  type ThemeCatalogEntry,
  type ThemeIsolationSnapshot,
} from "../isolation";

type WorkspacePackage = {
  name?: unknown;
  exports?: unknown;
  orgZhixing?: unknown;
};

type ThemeManifestRecord = {
  id?: unknown;
  defaultVariant?: unknown;
  variants?: unknown;
};

type RemoteThemeRecord = {
  remote?: unknown;
  entry?: unknown;
  expose?: unknown;
  package?: unknown;
  default_variant?: unknown;
  variants?: unknown;
};

export type ResolveThemeIsolationOptions = {
  workspaceRoot: string;
  configPath: string;
  themeEntryOverride?: string;
};

export const resolveThemeIsolation = async ({
  workspaceRoot,
  configPath,
  themeEntryOverride,
}: ResolveThemeIsolationOptions): Promise<ThemeIsolationSnapshot> => {
  const packagePath = join(workspaceRoot, "package.json");
  const rootPackage = JSON.parse(await readFile(packagePath, "utf8")) as {
    workspaces?: unknown;
  };
  const workspacePatterns = stringArray(rootPackage.workspaces, `${packagePath}#workspaces`);
  const packageDirectories = await discoverWorkspacePackages(workspaceRoot, workspacePatterns);
  const catalog: ThemeCatalogEntry[] = [];
  const watchFiles = [configPath, packagePath];

  const workspacePackages = await Promise.all(
    packageDirectories.map(async (directory) => {
      const themePackagePath = join(directory, "package.json");
      return { themePackagePath, packageJson: await readPackageJson(themePackagePath) };
    }),
  );
  for (const { themePackagePath, packageJson } of workspacePackages) {
    if (packageJson?.orgZhixing) {
      catalog.push(themeCatalogEntry(packageJson, relative(workspaceRoot, themePackagePath)));
      watchFiles.push(themePackagePath);
    }
  }

  const config = parse(await readFile(configPath, "utf8")) as Record<string, unknown>;
  for (const [id, value] of Object.entries(optionalRecord(config.theme_remotes))) {
    catalog.push(remoteThemeCatalogEntry(id, value, `${configPath}#theme_remotes.${id}`));
  }
  const selectedThemeId = stringValue(config.theme) ?? "elegant-blog";
  const selectedIndex = catalog.findIndex(({ id }) => id === selectedThemeId);
  const overrideEntry = themeEntryOverride?.trim();
  const selectedCatalogEntry = catalog[selectedIndex];
  if (overrideEntry && selectedCatalogEntry?.transport.kind === "federated") {
    catalog[selectedIndex] = {
      ...selectedCatalogEntry,
      transport: {
        ...selectedCatalogEntry.transport,
        entry: overrideEntry,
      },
    };
  }
  const selected = catalog.find(({ id }) => id === selectedThemeId);
  const selectedVariant =
    stringValue(config.theme_variant) ?? selected?.defaultVariant ?? "default";

  return defineThemeIsolationSnapshot({
    instanceId: `${resolve(configPath)}#${selectedThemeId}:${selectedVariant}`,
    selectedThemeId,
    selectedVariant,
    catalog,
    watchFiles,
  });
};

const themeCatalogEntry = (packageJson: WorkspacePackage, source: string): ThemeCatalogEntry => {
  const manifest = recordValue(packageJson.orgZhixing, `${source}#orgZhixing`);
  const packageName = requiredString(packageJson.name, `${source}#name`);
  const id = requiredString(manifest.id, `${source}#orgZhixing.id`);
  const variants = stringArray(manifest.variants, `${source}#orgZhixing.variants`);
  const defaultVariant = requiredString(
    manifest.defaultVariant,
    `${source}#orgZhixing.defaultVariant`,
  );
  if (!hasRootExport(packageJson.exports)) {
    throw new Error(`THEME-E007 ${source}: theme package must export "."`);
  }
  if (!variants.includes(defaultVariant)) {
    throw new Error(`THEME-E005 ${source}: default variant "${defaultVariant}" is not declared`);
  }
  return {
    id,
    package: packageName,
    defaultVariant,
    variants,
    transport: { kind: "workspace", module: packageName },
  };
};

const remoteThemeCatalogEntry = (
  idValue: string,
  value: unknown,
  source: string,
): ThemeCatalogEntry => {
  const remote = recordValue(value, source) as RemoteThemeRecord;
  const id = requiredString(idValue, `${source}.id`);
  const remoteName = requiredString(remote.remote, `${source}.remote`);
  if (!/^[A-Za-z][A-Za-z0-9_]*$/u.test(remoteName)) {
    throw new Error(`THEME-E031 ${source}.remote must be a Module Federation identifier`);
  }
  const entry = requiredString(remote.entry, `${source}.entry`);
  const exposedModule = requiredString(remote.expose, `${source}.expose`);
  if (!exposedModule.startsWith("./")) {
    throw new Error(`THEME-E031 ${source}.expose must start with "./"`);
  }
  const variants = stringArray(remote.variants, `${source}.variants`);
  const defaultVariant = requiredString(remote.default_variant, `${source}.default_variant`);
  if (!variants.includes(defaultVariant)) {
    throw new Error(`THEME-E005 ${source}: default variant "${defaultVariant}" is not declared`);
  }
  return {
    id,
    package: stringValue(remote.package),
    defaultVariant,
    variants,
    transport: {
      kind: "federated",
      module: `${remoteName}/${exposedModule.slice(2)}`,
      remoteName,
      entry,
      exposedModule: exposedModule as `./${string}`,
    },
  };
};

const discoverWorkspacePackages = async (
  workspaceRoot: string,
  patterns: readonly string[],
): Promise<string[]> => {
  return (
    await Promise.all(
      patterns.map(async (pattern) => {
        if (!pattern.endsWith("/*")) {
          throw new Error(`unsupported workspace pattern: ${pattern}`);
        }
        const parent = join(workspaceRoot, pattern.slice(0, -2));
        return (await readdir(parent, { withFileTypes: true }))
          .filter((entry) => entry.isDirectory())
          .map((entry) => join(parent, entry.name));
      }),
    )
  ).flat();
};

const readPackageJson = async (path: string): Promise<WorkspacePackage | null> => {
  try {
    return JSON.parse(await readFile(path, "utf8")) as WorkspacePackage;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
};

const hasRootExport = (value: unknown): boolean =>
  Boolean(value && typeof value === "object" && !Array.isArray(value) && "." in value);

const recordValue = (value: unknown, path: string): ThemeManifestRecord => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`THEME-E009 ${path} must be an object`);
  }
  return value as ThemeManifestRecord;
};

const optionalRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const requiredString = (value: unknown, path: string): string => {
  const normalized = stringValue(value);
  if (!normalized) throw new Error(`THEME-E009 ${path} must be a non-empty string`);
  return normalized;
};

const stringValue = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const stringArray = (value: unknown, path: string): string[] => {
  if (!Array.isArray(value)) throw new Error(`THEME-E009 ${path} must be an array`);
  return value.map((entry) => requiredString(entry, path));
};
