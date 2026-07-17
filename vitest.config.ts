import { defineConfig } from "vitest/config";
import { resolve } from "node:path";
import { resolveThemeIsolation } from "./src/theme-system/build/resolveThemeIsolation";
import { themeIsolationPlugin } from "./src/theme-system/build/themeIsolationPlugin";

const themeIsolation = await resolveThemeIsolation({
  workspaceRoot: import.meta.dirname,
  configPath: resolve(import.meta.dirname, "tests/fixtures/elegant-blog-site.toml"),
});

export default defineConfig({
  plugins: [themeIsolationPlugin.vite(themeIsolation)],
  test: {
    execArgv: ["--no-experimental-webstorage"],
    environment: "happy-dom",
    environmentOptions: {
      happyDOM: {
        settings: {
          navigation: {
            disableChildFrameNavigation: true,
            disableFallbackToSetURL: true,
          },
        },
      },
    },
  },
});
