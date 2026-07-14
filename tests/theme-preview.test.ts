import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import {
  replaceThemeSelection,
  replaceThemePreviewSelection,
  resolveThemePreview,
  themePreviewConfigName,
  themePreviewEnvironment,
  themePreviewUrl,
} from "../packages/theme-tooling/src/theme-preview.mjs";

describe("theme preview tooling", () => {
  it("lists themes through the preview command without acquiring a port", () => {
    const result = spawnSync(
      process.execPath,
      ["packages/theme-tooling/src/theme-preview.mjs", "list"],
      { encoding: "utf8" },
    );

    expect(result.status).toBe(0);
    expect(result.stdout).toBe("documents\nelegant-blog\nminimal-notes\n");
    expect(result.stderr).toBe("");
  });

  it("changes only the canonical theme selection fields", async () => {
    const source = await readFile("public/org-zhixing.toml", "utf8");
    const preview = replaceThemeSelection(source, "minimal-notes", "paper");
    expect(preview).toContain('theme = "minimal-notes"');
    expect(preview).toContain('theme_variant = "paper"');
    expect(preview).toContain("[site]");
    expect(source).not.toBe(preview);
  });

  it("validates workspace theme ids and variants", async () => {
    await expect(resolveThemePreview({ theme: "minimal-notes" })).resolves.toMatchObject({
      id: "minimal-notes",
      defaultVariant: "paper",
    });
    await expect(resolveThemePreview({ theme: "documents" })).resolves.toMatchObject({
      id: "documents",
      defaultVariant: "mocha",
      variants: ["latte", "frappe", "macchiato", "mocha"],
    });
  });

  it("binds the docs theme preview to workspace docs content and the root route", async () => {
    const source = await readFile("public/org-zhixing.toml", "utf8");
    const docsTheme = await resolveThemePreview({ theme: "documents" });
    const preview = replaceThemePreviewSelection(source, docsTheme);

    expect(preview).toContain('theme = "documents"');
    expect(preview).toContain('content_dir = "docs"');
    expect(preview).toContain('content_base = "workspace"');
    expect(themePreviewUrl("5195", docsTheme)).toBe("http://127.0.0.1:5195/");
  });

  it("uses a root development base while keeping the selected config authoritative", async () => {
    expect(themePreviewUrl("5195")).toBe("http://127.0.0.1:5195/blogs");
    const configName = themePreviewConfigName("minimal-notes", "5195");
    expect(configName).toBe("org-zhixing-preview-minimal-notes-5195.toml");
    expect(themePreviewUrl("5195")).not.toContain("?");
    expect(themePreviewEnvironment({}, "/tmp/preview.toml", "/tmp/cache-5195")).toMatchObject({
      ORG_ZHIXING_BASE_PATH: "/",
      ORG_ZHIXING_CACHE_ROOT: "/tmp/cache-5195",
      ORG_ZHIXING_CONFIG: "/tmp/preview.toml",
    });
    expect(
      themePreviewEnvironment(
        {},
        "/tmp/preview.toml",
        "/tmp/cache-5195",
        "/workspace/poo-flow/docs",
      ),
    ).toMatchObject({
      ORG_ZHIXING_CONTENT_DIR: "/workspace/poo-flow/docs",
    });
    expect(await readFile("scripts/generate-static-site.mjs", "utf8")).toContain(
      "process.env.ORG_ZHIXING_CONFIG",
    );
    const rsbuildConfig = await readFile("rsbuild.config.ts", "utf8");
    expect(rsbuildConfig).toContain("process.env.ORG_ZHIXING_CONFIG");
    expect(rsbuildConfig).toContain("__ORG_ZHIXING_CONFIG_SOURCE__");
    expect(rsbuildConfig).toContain("strictPort: true");
  });
});
