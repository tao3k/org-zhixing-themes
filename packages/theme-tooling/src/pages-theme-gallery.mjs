import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { discoverThemes } from "./theme-list.mjs";

const requiredArgument = (args, name) => {
  const index = args.indexOf(name);
  const value = index >= 0 ? args[index + 1] : undefined;
  if (!value || value.startsWith("--")) {
    throw new Error(`PAGES-E010 missing required ${name}`);
  }
  return value;
};

export const parsePagesThemeGalleryArgs = (args, workspaceRoot = process.cwd()) => ({
  workspaceRoot: resolve(workspaceRoot),
  configPath: resolve(workspaceRoot, requiredArgument(args, "--config")),
  outputDir: resolve(workspaceRoot, requiredArgument(args, "--out")),
  basePath: requiredArgument(args, "--base").replace(/\/+$/, "/"),
});

export const themeConfigSource = (
  source,
  theme,
  baseUrl = source.match(/^base_url\s*=\s*"([^"]+)"$/m)?.[1],
  contentDirectory = theme.content?.directory,
) => {
  if (!/^theme\s*=.*$/m.test(source) || !/^theme_variant\s*=.*$/m.test(source)) {
    throw new Error("PAGES-E011 config must define theme and theme_variant");
  }
  return source
    .replace(/^theme\s*=.*$/m, `theme = "${theme.id}"`)
    .replace(/^theme_variant\s*=.*$/m, `theme_variant = "${theme.defaultVariant}"`)
    .replace(/^base_url\s*=.*$/m, `base_url = "${baseUrl}"`)
    .replace(/^content_dirs\s*=.*$/m, `content_dirs = ["${contentDirectory}"]`)
    .replace(/^content_dir\s*=.*$/m, `content_dir = "${contentDirectory}"`);
};

export const generatePagesThemeGallery = async (options) => {
  const themes = await discoverThemes(options.workspaceRoot);
  const source = await readFile(options.configPath, "utf8");
  const configDirectory = join(options.outputDir, "theme-configs");
  await mkdir(configDirectory, { recursive: true });

  const manifestThemes = [];
  for (const theme of themes) {
    const configuredBaseUrl = source.match(/^base_url\s*=\s*"([^"]+)"$/m)?.[1];
    if (!configuredBaseUrl) {
      throw new Error("PAGES-E012 config must define an absolute base_url");
    }
    const themeBaseUrl = new URL(`themes/${theme.id}/`, configuredBaseUrl).toString();
    const relativeConfigPath = `theme-configs/${theme.id}.toml`;
    await writeFile(
      join(options.outputDir, relativeConfigPath),
      themeConfigSource(source, theme, themeBaseUrl, theme.content?.directory),
      "utf8",
    );
    manifestThemes.push({
      id: theme.id,
      name: theme.name,
      defaultVariant: theme.defaultVariant,
      variants: theme.variants,
      capabilities: theme.capabilities,
      content: theme.content,
      config: relativeConfigPath,
      preview: `${options.basePath}themes/${theme.id}/`,
    });
  }

  const manifest = {
    schemaVersion: 1,
    defaultTheme: "documents",
    themes: manifestThemes,
  };
  const manifestPath = join(options.outputDir, "theme-manifest.json");
  await mkdir(dirname(manifestPath), { recursive: true });
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return manifest;
};

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const options = parsePagesThemeGalleryArgs(process.argv.slice(2));
  const manifest = await generatePagesThemeGallery(options);
  console.log(
    `pages-theme-gallery themes=${manifest.themes.length} default=${manifest.defaultTheme}`,
  );
}
