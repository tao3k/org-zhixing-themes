import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { parse } from "smol-toml";
import { resolveThemeIsolation } from "./src/theme-system/build/resolveThemeIsolation";
import { createThemeFederationPlugin } from "./src/theme-system/build/themeFederationPlugin";
import { themeIsolationPlugin } from "./src/theme-system/build/themeIsolationPlugin";

const projectRoot = dirname(fileURLToPath(import.meta.url));
const orgizePackageRoot = resolve(projectRoot, "node_modules/orgize");
const publicRoot = resolve(projectRoot, "public");
const externalContentRoot = process.env.ORG_ZHIXING_CONTENT_DIR
  ? resolve(process.env.ORG_ZHIXING_CONTENT_DIR)
  : null;
const cacheRoot = resolve(projectRoot, process.env.ORG_ZHIXING_CACHE_ROOT ?? ".cache/org-zhixing");
const publicConfigPath = process.env.ORG_ZHIXING_CONFIG
  ? resolve(projectRoot, process.env.ORG_ZHIXING_CONFIG)
  : resolve(publicRoot, "org-zhixing.toml");
const themeIsolation = await resolveThemeIsolation({
  workspaceRoot: projectRoot,
  configPath: publicConfigPath,
});
const themeFederation = createThemeFederationPlugin(themeIsolation);
const selectedThemeTransport = themeIsolation.catalog.find(
  ({ id }) => id === themeIsolation.selectedThemeId,
)?.transport;
const applicationEntry =
  selectedThemeTransport?.kind === "federated" ? "src/federated-main.ts" : "src/main.tsx";
const publicConfigSource = readFileSync(publicConfigPath, "utf8");
const publicConfig = parse(publicConfigSource) as Record<string, unknown>;
const contentRoot = configuredContentRoot(publicConfig);
const attachmentLogicalRoot = configuredAttachmentRoot(publicConfig, contentRoot);
const attachmentSourceRoot = externalContentRoot
  ? resolve(externalContentRoot, relativeContentPath(attachmentLogicalRoot, contentRoot))
  : resolve(publicRoot, attachmentLogicalRoot);
const attachmentOutputRoot = publicMediaPath(attachmentLogicalRoot);
const staticManifestPath = resolve(cacheRoot, "static-site.json");
const staticGalleryPath = resolve(cacheRoot, "org-zhixing.gallery.json");
const staticSourceShardRoot = resolve(cacheRoot, "org-zhixing.sources");
const staticMemoryShardRoot = resolve(cacheRoot, "org-zhixing.memory");
const staticSectionShardRoot = resolve(cacheRoot, "org-zhixing.sections");
const staticAttachmentShardRoot = resolve(projectRoot, cacheRoot, "org-zhixing.attachments");
const staticAgendaShardRoot = resolve(cacheRoot, "org-zhixing.agenda");
const staticThumbnailRoot = resolve(cacheRoot, "org-zhixing.thumbnails");
const orgizePackageWatchFiles = existsSync(orgizePackageRoot)
  ? [
      resolve(orgizePackageRoot, "worker.js"),
      resolve(orgizePackageRoot, "dto.js"),
      resolve(orgizePackageRoot, "package.json"),
      resolve(orgizePackageRoot, "dist/**/*"),
    ]
  : [];
const deploymentBasePath = normalizeBasePath(
  process.env.ORG_ZHIXING_BASE_PATH ?? deploymentBasePathFromConfig(publicConfigPath),
);
const assetPrefix = deploymentBasePath === "/" ? "/" : `${deploymentBasePath}/`;

export default defineConfig({
  plugins: [
    pluginReact(),
    ...(themeFederation ? [themeFederation] : []),
    themeIsolationPlugin.rsbuild(themeIsolation),
  ],
  resolve: {
    alias: {
      "@org-zhixing-cache": cacheRoot,
    },
  },
  source: {
    define: {
      __ORG_ZHIXING_BASE_PATH__: JSON.stringify(deploymentBasePath),
      __ORG_ZHIXING_CONFIG_SOURCE__: JSON.stringify(publicConfigSource),
    },
    entry: {
      app: resolve(projectRoot, applicationEntry),
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
      ...(existsSync(staticGalleryPath)
        ? [{ from: staticGalleryPath, to: "org-zhixing.gallery.json" }]
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
      ...(existsSync(staticThumbnailRoot)
        ? [
            {
              from: resolve(staticThumbnailRoot, "*.webp"),
              to: "org-zhixing.thumbnails/[name][ext]",
            },
          ]
        : []),
      ...(existsSync(attachmentSourceRoot)
        ? [{ from: attachmentSourceRoot, to: attachmentOutputRoot }]
        : []),
    ],
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    historyApiFallback: true,
    publicDir: {
      name: publicRoot,
      copyOnBuild: !externalContentRoot,
      watch: true,
    },
  },
  dev: {
    hmr: true,
    liveReload: true,
    progressBar: true,
    watchFiles: [
      {
        paths: [
          resolve(publicRoot, "**/*.{org,toml}"),
          ...(externalContentRoot ? [resolve(externalContentRoot, "**/*.org")] : []),
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
  tools: {
    rspack: (_config, { appendRules }) => {
      appendRules({
        test: /typst_ts_(?:web_compiler|renderer)_bg\.wasm$/,
        resourceQuery: /url/,
        type: "asset/resource",
      });
    },
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

function configuredContentRoot(config: Record<string, unknown>): string {
  const content = recordValue(config.content);
  return normalizeLogicalPath(stringValue(content.content_dir) ?? "blog");
}

function configuredAttachmentRoot(config: Record<string, unknown>, contentRoot: string): string {
  const attachments = recordValue(config.attachments);
  const configured = normalizeLogicalPath(stringValue(attachments.attach_id_dir) ?? ".attach");
  return configured.startsWith(`${contentRoot}/`) ? configured : `${contentRoot}/${configured}`;
}

function relativeContentPath(path: string, contentRoot: string): string {
  return path === contentRoot ? "" : path.replace(new RegExp(`^${escapeRegExp(contentRoot)}/`), "");
}

function publicMediaPath(path: string): string {
  const safePath = path
    .split("/")
    .map((segment) => segment.replace(/^\.+/u, ""))
    .filter(Boolean)
    .join("/");
  return `org-zhixing.media/${safePath}`;
}

function normalizeLogicalPath(value: string): string {
  return value.replace(/^\/+|\/+$/gu, "");
}

function recordValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}
