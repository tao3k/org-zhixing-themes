import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  pagesBuildEnvironment,
  parsePagesBuildArgs,
  validatePagesBuildConfig,
} from "../packages/theme-tooling/src/pages-build.mjs";

const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { force: true, recursive: true });
});

describe("Pages build tooling", () => {
  it("parses the complete downstream contract", () => {
    const options = parsePagesBuildArgs(
      ["--config", "site.toml", "--content", "docs", "--base", "/project/", "--out", "../pages"],
      "/workspace/builder",
    );

    expect(options).toMatchObject({
      basePath: "/project/",
      configPath: "/workspace/builder/site.toml",
      contentDir: "/workspace/builder/docs",
      outputDir: "/workspace/pages",
    });
  });

  it("rejects a base path that disagrees with the site config", async () => {
    const root = mkdtempSync(join(tmpdir(), "org-zhixing-pages-test-"));
    roots.push(root);
    mkdirSync(join(root, "docs"));
    writeFileSync(join(root, "site.toml"), '[site]\nbase_url = "https://example.test/project/"\n');
    const options = parsePagesBuildArgs(
      [
        "--config",
        "site.toml",
        "--content",
        "docs",
        "--base",
        "/wrong/",
        "--out",
        join(tmpdir(), "org-zhixing-pages-output"),
      ],
      root,
    );

    await expect(validatePagesBuildConfig(options)).rejects.toThrow("PAGES-E003");
  });

  it("owns all internal build environment variables", () => {
    expect(
      pagesBuildEnvironment(
        { KEEP: "yes" },
        {
          basePath: "/project",
          configPath: "/workspace/site.toml",
          contentDir: "/workspace/docs",
        },
        "/tmp/cache",
      ),
    ).toMatchObject({
      KEEP: "yes",
      ORG_ZHIXING_BASE_PATH: "/project",
      ORG_ZHIXING_CACHE_ROOT: "/tmp/cache",
      ORG_ZHIXING_CONFIG: "/workspace/site.toml",
      ORG_ZHIXING_CONTENT_DIR: "/workspace/docs",
    });
  });
});
