import { createUnplugin } from "unplugin";
import {
  renderThemeRuntimeModule,
  resolvedThemeRuntimeModuleId,
  themeRuntimeModuleId,
  type ThemeIsolationSnapshot,
} from "../isolation";

export const themeIsolationPlugin = createUnplugin<ThemeIsolationSnapshot>((snapshot) => ({
  name: "org-zhixing-theme-isolation",
  buildStart() {
    for (const path of snapshot.watchFiles) this.addWatchFile(path);
  },
  resolveId: {
    filter: { id: new RegExp(`^${escapeRegExp(themeRuntimeModuleId)}$`) },
    handler(id) {
      return id === themeRuntimeModuleId ? resolvedThemeRuntimeModuleId : null;
    },
  },
  load: {
    filter: { id: new RegExp(`^${escapeRegExp(resolvedThemeRuntimeModuleId)}$`) },
    handler(id) {
      return id === resolvedThemeRuntimeModuleId ? renderThemeRuntimeModule(snapshot) : null;
    },
  },
}));

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
