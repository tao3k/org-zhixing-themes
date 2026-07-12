import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateThemePackage } from "./theme-manifest.mjs";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const [id, ...options] = process.argv.slice(2);
const rootOption = options.indexOf("--root");
const root = rootOption >= 0 ? resolve(options[rootOption + 1] ?? "") : projectRoot;

if (!id || !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(id)) {
  throw new Error("THEME-E009 theme id must be lower-case kebab-case");
}
if (rootOption >= 0 && !options[rootOption + 1]) {
  throw new Error("THEME-E009 --root requires a directory");
}

const packageName = `@org-zhixing/theme-${id}`;
const themeRoot = join(root, "themes", id);
const packageJson = {
  name: packageName,
  version: "0.1.0",
  private: true,
  type: "module",
  exports: { ".": "./src/index.ts" },
  orgZhixing: {
    schemaVersion: 1,
    id,
    displayName: displayName(id),
    engine: ">=0.1 <0.2",
    defaultVariant: "default",
    variants: ["default"],
    capabilities: ["blog"],
    publicSlots: [
      {
        id: "site-header",
        strategies: ["wrap", "replace"],
        runtime: "universal",
        stability: "stable",
      },
    ],
    renderers: { "react-spa": { export: ".", serverComponents: false } },
    renderModes: ["static"],
    configSchema: "./theme-config.schema.json",
  },
};

validateThemePackage(packageJson, `${themeRoot}/package.json`);
await mkdir(join(root, "themes"), { recursive: true });
try {
  await mkdir(themeRoot);
} catch (error) {
  if (error?.code === "EEXIST") {
    throw new Error(`THEME-E009 theme directory already exists: ${themeRoot}`);
  }
  throw error;
}
await mkdir(join(themeRoot, "src"));
await Promise.all([
  writeFile(join(themeRoot, "package.json"), `${JSON.stringify(packageJson, null, 2)}\n`),
  writeFile(
    join(themeRoot, "theme-config.schema.json"),
    `${JSON.stringify(configSchema(id), null, 2)}\n`,
  ),
  writeFile(join(themeRoot, "src/index.ts"), themeSource(packageJson.orgZhixing)),
]);

console.log(`theme-create status=ok id=${id} path=${themeRoot}`);

function displayName(value) {
  return value
    .split("-")
    .map((part) => `${part[0].toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function configSchema(themeId) {
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: `https://org-zhixing.dev/themes/${themeId}/config.schema.json`,
    title: `${displayName(themeId)} theme configuration`,
    type: "object",
    additionalProperties: false,
    properties: {},
  };
}

function themeSource(manifest) {
  return `import { defineThemePackage } from "../../../src/library/themePackage";\n\nconst manifest = ${JSON.stringify({ ...manifest, package: packageName, version: "0.1.0" }, null, 2)} as const;\n\nexport default defineThemePackage({\n  manifest,\n  variants: [\n    {\n      id: "default",\n      label: "Default",\n      tokens: {\n        color: { canvas: "#f8f8f6", surface: "#ffffff", text: "#202124", accent: "#315c9b" },\n        typography: { body: "ui-sans-serif, system-ui, sans-serif", heading: "ui-serif, Georgia, serif", mono: "ui-monospace, monospace" },\n        spacing: { xs: "4px", sm: "8px", md: "16px", lg: "32px" },\n      },\n    },\n  ],\n  layouts: {\n    default: ({ document, route }, api) =>\n      api.renderView({ view: route.view ?? "blog", document: document ?? null }),\n  },\n});\n`;
}
