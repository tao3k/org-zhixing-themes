import { createContext, useContext, type ReactNode } from "react";
import {
  isolatedSelectedThemeId,
  isolatedSelectedThemeMetadata,
  isolatedSelectedVariant,
  loadIsolatedSelectedTheme,
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

const createIsolatedThemeRuntime = async (): Promise<ThemeRuntime> => {
  const selectedTheme = await loadIsolatedSelectedTheme();
  const registry = createThemeRegistry([selectedTheme]);
  const catalogEntry = isolatedSelectedThemeMetadata;
  const manifest = themePackageManifestFor(selectedTheme);
  if (
    catalogEntry.id !== isolatedSelectedThemeId ||
    selectedTheme.name !== isolatedSelectedThemeId
  ) {
    throw new Error(
      `THEME-E032 theme module contract mismatch: expected "${isolatedSelectedThemeId}", received "${selectedTheme.name}"`,
    );
  }
  if (
    !manifest.variants.includes(isolatedSelectedVariant) ||
    !catalogEntry.variants.includes(isolatedSelectedVariant)
  ) {
    throw new Error(
      `THEME-E032 theme module "${isolatedSelectedThemeId}" does not provide variant "${isolatedSelectedVariant}"`,
    );
  }
  return Object.freeze({
    isolationId: themeIsolationId,
    selection: isolatedSelectedThemeMetadata,
    selectedTheme,
    registry,
  });
};

let isolatedThemeRuntimePromise: Promise<ThemeRuntime> | undefined;

export const loadIsolatedThemeRuntime = (): Promise<ThemeRuntime> => {
  isolatedThemeRuntimePromise ??= createIsolatedThemeRuntime();
  return isolatedThemeRuntimePromise;
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
