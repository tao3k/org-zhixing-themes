#!/usr/bin/env node
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";

export const discoverThemes = async (workspaceRoot = process.cwd()) => {
  const themesRoot = resolve(workspaceRoot, "themes");
  const entries = await readdir(themesRoot, { withFileTypes: true });
  const candidates = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => {
        const directory = resolve(themesRoot, entry.name);
        let manifest;
        try {
          manifest = JSON.parse(await readFile(resolve(directory, "package.json"), "utf8"));
        } catch (error) {
          if (error?.code === "ENOENT") return null;
          throw error;
        }
        const metadata = manifest.orgZhixing ?? {};
        if (!metadata.id) return null;
        return {
          directory,
          defaultVariant: metadata.defaultVariant ?? metadata.variants?.[0] ?? "default",
          id: metadata.id ?? entry.name,
          name: metadata.name ?? manifest.name ?? entry.name,
          variants: Array.isArray(metadata.variants) ? metadata.variants : [],
        };
      }),
  );
  const themes = candidates.filter(Boolean);
  return themes.sort((left, right) => left.id.localeCompare(right.id));
};

export const formatThemeList = (themes) => themes.map((theme) => theme.id).join("\n");

if (import.meta.url === `file://${process.argv[1]}`) {
  const themes = await discoverThemes();
  console.log(formatThemeList(themes));
}
