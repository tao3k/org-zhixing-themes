import { createContext, useContext, type ReactNode } from "react";
import {
  isolatedSelectedThemeMetadata,
  isolatedSelectedVariant,
  isolatedThemeCatalog,
  loadIsolatedSelectedTheme,
  loadThemeById,
  themeIsolationId,
} from "virtual:org-zhixing/theme-runtime";
import { createThemeRegistry, type ThemeRegistry } from "../../library/themeRegistry";
import type { ZhixingTheme } from "../../library/theme";
import { themePackageManifestFor } from "../../library/themePackage";
import type { ThemeCatalogEntry } from "../isolation";

export type ThemeRuntime = {
  readonly isolationId: string;
  readonly selection: ThemeCatalogEntry;
  readonly selectedTheme: ZhixingTheme;
  readonly registry: ThemeRegistry;
};

const createThemeRuntime = async (
  selection: ThemeCatalogEntry,
  loadTheme: () => Promise<ZhixingTheme>,
  variant = selection.defaultVariant,
): Promise<ThemeRuntime> => {
  const selectedTheme = await loadTheme();
  const registry = createThemeRegistry([selectedTheme]);
  const manifest = themePackageManifestFor(selectedTheme);
  if (
    selection.id !== selectedTheme.name
  ) {
    throw new Error(
      `THEME-E032 theme module contract mismatch: expected "${selection.id}", received "${selectedTheme.name}"`,
    );
  }
  if (
    !manifest.variants.includes(variant) ||
    !selection.variants.includes(variant)
  ) {
    throw new Error(
      `THEME-E032 theme module "${selection.id}" does not provide variant "${variant}"`,
    );
  }
  return Object.freeze({
    isolationId: themeIsolationId,
    selection,
    selectedTheme,
    registry,
  });
};

const createIsolatedThemeRuntime = (): Promise<ThemeRuntime> =>
  createThemeRuntime(
    isolatedSelectedThemeMetadata,
    loadIsolatedSelectedTheme,
    isolatedSelectedVariant,
  );

let isolatedThemeRuntimePromise: Promise<ThemeRuntime> | undefined;

export const loadIsolatedThemeRuntime = (): Promise<ThemeRuntime> => {
  isolatedThemeRuntimePromise ??= createIsolatedThemeRuntime().catch((error: unknown) => {
    isolatedThemeRuntimePromise = undefined;
    throw error;
  });
  return isolatedThemeRuntimePromise;
};

const themeRuntimePromises = new Map<string, Promise<ThemeRuntime>>();

export const loadThemeRuntimeById = (themeId: string): Promise<ThemeRuntime> => {
  const selection = isolatedThemeCatalog.find(({ id }) => id === themeId);
  if (!selection) {
    return Promise.reject(new Error(`THEME-E001 unknown theme "${themeId}"`));
  }
  let runtime = themeRuntimePromises.get(themeId);
  if (!runtime) {
    runtime = createThemeRuntime(selection, () => loadThemeById(themeId)).catch((error: unknown) => {
      themeRuntimePromises.delete(themeId);
      throw error;
    });
    themeRuntimePromises.set(themeId, runtime);
  }
  return runtime;
};

const ThemeRuntimeContext = createContext<ThemeRuntime | null>(null);

export const ThemeRuntimeProvider = ({
  children,
  runtime,
}: {
  children: ReactNode;
  runtime: ThemeRuntime;
}) => <ThemeRuntimeContext value={runtime}>{children}</ThemeRuntimeContext>;

export const useThemeRuntime = (): ThemeRuntime => {
  const runtime = useContext(ThemeRuntimeContext);
  if (!runtime) {
    throw new Error("THEME-E030 theme runtime must be used inside ThemeRuntimeProvider");
  }
  return runtime;
};
