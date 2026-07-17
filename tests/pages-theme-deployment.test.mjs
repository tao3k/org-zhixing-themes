import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { generatePagesThemeGallery } from "../packages/theme-tooling/src/pages-theme-gallery.mjs";

const temporaryDirectories = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe("GitHub Pages isolated theme deployments", () => {
  it("projects each theme onto its own deployment base", async () => {
    const outputDir = await mkdtemp(join(tmpdir(), "org-zhixing-theme-pages-"));
    temporaryDirectories.push(outputDir);

    const manifest = await generatePagesThemeGallery({
      workspaceRoot: process.cwd(),
      configPath: resolve("public/org-zhixing.toml"),
      outputDir,
      basePath: "/org-zhixing-themes/",
    });

    const elegant = manifest.themes.find(({ id }) => id === "elegant-blog");
    expect(elegant?.preview).toBe("/org-zhixing-themes/themes/elegant-blog/");
    expect(elegant?.content).toEqual({
      base: "workspace",
      directory: "blog",
      routeMode: "blog",
    });

    const elegantConfig = await readFile(
      join(outputDir, "theme-configs/elegant-blog.toml"),
      "utf8",
    );
    expect(elegantConfig).toContain('theme = "elegant-blog"');
    expect(elegantConfig).toContain('content_dirs = ["blog"]');
    expect(elegantConfig).toContain('content_dir = "blog"');
    expect(elegantConfig).toContain(
      'base_url = "https://tao3k.github.io/org-zhixing-themes/themes/elegant-blog/"',
    );
  });
});
