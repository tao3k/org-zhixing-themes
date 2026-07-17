import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  generatePagesThemeGallery,
  themeConfigSource,
} from "../packages/theme-tooling/src/pages-theme-gallery.mjs";

const temporaryDirectories = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((path) => rm(path, { recursive: true })));
});

describe("GitHub Pages theme gallery", () => {
  it("projects a theme and its default variant into the Pages config", () => {
    const source = 'theme = "documents"\ntheme_variant = "mocha"\n';
    expect(
      themeConfigSource(source, {
        id: "minimal-notes",
        defaultVariant: "paper",
      }),
    ).toBe('theme = "minimal-notes"\ntheme_variant = "paper"\n');
  });

  it("generates preview configs from the live theme registry", async () => {
    const outputDir = await mkdtemp(join(tmpdir(), "org-zhixing-pages-"));
    temporaryDirectories.push(outputDir);
    const manifest = await generatePagesThemeGallery({
      workspaceRoot: process.cwd(),
      configPath: resolve("public/org-zhixing.toml"),
      outputDir,
      basePath: "/org-zhixing-themes/",
    });

    expect(manifest.defaultTheme).toBe("documents");
    expect(manifest.themes.map(({ id }) => id)).toEqual([
      "documents",
      "elegant-blog",
      "minimal-notes",
      "theme-gallery",
    ]);
    expect(manifest.themes[1].preview).toBe("/org-zhixing-themes/themes/elegant-blog/");
    expect(await readFile(join(outputDir, "theme-configs/documents.toml"), "utf8")).toContain(
      'theme = "documents"',
    );
  });
});
