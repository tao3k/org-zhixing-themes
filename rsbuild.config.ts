import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { parse } from "smol-toml";

const projectRoot = dirname(fileURLToPath(import.meta.url));
const orgizePackageRoot = resolve(projectRoot, "node_modules/orgize");
const publicRoot = resolve(projectRoot, "public");
const publicConfigPath = resolve(publicRoot, "org-zhixing.toml");
const staticManifestPath = resolve(projectRoot, ".cache/org-zhixing/static-site.json");
const staticSourceShardRoot = resolve(projectRoot, ".cache/org-zhixing/org-zhixing.sources");
const staticMemoryShardRoot = resolve(projectRoot, ".cache/org-zhixing/org-zhixing.memory");
const staticSectionShardRoot = resolve(projectRoot, ".cache/org-zhixing/org-zhixing.sections");
const staticAttachmentShardRoot = resolve(
  projectRoot,
  ".cache/org-zhixing/org-zhixing.attachments",
);
const staticAgendaShardRoot = resolve(projectRoot, ".cache/org-zhixing/org-zhixing.agenda");
const orgizePackageWatchFiles = existsSync(orgizePackageRoot)
  ? [
      resolve(orgizePackageRoot, "worker.js"),
      resolve(orgizePackageRoot, "dto.js"),
      resolve(orgizePackageRoot, "package.json"),
      resolve(orgizePackageRoot, "dist/**/*"),
    ]
  : [];
const deploymentBasePath = deploymentBasePathFromConfig(publicConfigPath);
const assetPrefix = deploymentBasePath === "/" ? "auto" : `${deploymentBasePath}/`;

export default defineConfig({
  plugins: [pluginReact()],
  source: {
    define: {
      __ORG_ZHIXING_BASE_PATH__: JSON.stringify(deploymentBasePath),
    },
    entry: {
      app: resolve(projectRoot, "src/main.tsx"),
    },
  },
  html: {
    template: resolve(projectRoot, "index.html"),
    scriptLoading: "module",
  },
  output: {
    assetPrefix,
    cleanDistPath: true,
    distPath: {
      root: "dist",
      js: "assets",
      jsAsync: "assets",
      css: "assets",
      cssAsync: "assets",
      wasm: "assets",
      assets: "assets",
    },
    filename: {
      html: "index.html",
      js: "[name].[contenthash:8].js",
      css: "[name].[contenthash:8].css",
      wasm: "[name].[contenthash:8][ext]",
      assets: "[name].[contenthash:8][ext]",
    },
    copy: [
      ...(existsSync(staticManifestPath)
        ? [{ from: staticManifestPath, to: "org-zhixing.static.json" }]
        : []),
      ...(existsSync(staticSourceShardRoot)
        ? [
            {
              from: resolve(staticSourceShardRoot, "*.json"),
              to: "org-zhixing.sources/[name][ext]",
            },
          ]
        : []),
      ...(existsSync(staticMemoryShardRoot)
        ? [{ from: resolve(staticMemoryShardRoot, "*.json"), to: "org-zhixing.memory/[name][ext]" }]
        : []),
      ...(existsSync(staticSectionShardRoot)
        ? [
            {
              from: resolve(staticSectionShardRoot, "*.json"),
              to: "org-zhixing.sections/[name][ext]",
            },
          ]
        : []),
      ...(existsSync(staticAttachmentShardRoot)
        ? [
            {
              from: resolve(staticAttachmentShardRoot, "*.json"),
              to: "org-zhixing.attachments/[name][ext]",
            },
          ]
        : []),
      ...(existsSync(staticAgendaShardRoot)
        ? [{ from: resolve(staticAgendaShardRoot, "*.json"), to: "org-zhixing.agenda/[name][ext]" }]
        : []),
    ],
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
    historyApiFallback: true,
    publicDir: {
      name: publicRoot,
      copyOnBuild: true,
      watch: true,
    },
  },
  dev: {
    assetPrefix: "auto",
    hmr: true,
    liveReload: true,
    progressBar: true,
    watchFiles: [
      {
        paths: [
          resolve(publicRoot, "**/*.{org,toml}"),
          resolve(projectRoot, "index.html"),
          ...orgizePackageWatchFiles,
        ],
        type: "reload-page",
      },
    ],
  },
  splitChunks: {
    chunks: "all",
  },
});

function deploymentBasePathFromConfig(configPath: string): string {
  if (!existsSync(configPath)) {
    return "/";
  }
  const raw = parse(readFileSync(configPath, "utf8")) as Record<string, unknown>;
  const site =
    raw.site && typeof raw.site === "object" ? (raw.site as Record<string, unknown>) : {};
  return normalizeBasePath(
    stringValue(site.base_path) ?? basePathFromUrl(stringValue(site.base_url)) ?? "/",
  );
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function basePathFromUrl(value: string | null): string | null {
  if (!value) {
    return null;
  }
  try {
    return new URL(value).pathname;
  } catch {
    return value;
  }
}

function normalizeBasePath(value: string): string {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "/") {
    return "/";
  }
  return `/${trimmed.replace(/^\/+|\/+$/g, "")}`;
}
