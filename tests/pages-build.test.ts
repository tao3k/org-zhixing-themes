import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  materializePagesRouteShells,
  materializeStaticRouteShells,
  pagesBuildEnvironment,
  parsePagesBuildArgs,
  validatePagesBuildConfig,
} from "../packages/theme-tooling/src/pages-build.mjs";
import {
  normalizeSpaShells,
  spaShellBasePath,
} from "../packages/theme-tooling/src/normalize-spa-shells.mjs";

const roots: string[] = [];

it("emits Typst Wasm assets under the Pages base path", async () => {
  const outputDir = mkdtempSync(join(tmpdir(), "org-zhixing-pages-typst-"));
  roots.push(outputDir);

  await runPagesBuild({
    configPath: join(process.cwd(), "public", "org-zhixing.toml"),
    contentDir: join(process.cwd(), "blog"),
    outputDir,
    basePath: "/org-zhixing-themes/",
    workspaceRoot: process.cwd(),
  });

  const manifest = JSON.parse(readFileSync(join(outputDir, "asset-manifest.json"), "utf8")) as {
    allFiles?: string[];
  };
  const allFiles = manifest.allFiles ?? [];
  const compiler = allFiles.filter((file) =>
    /^assets\/typst_ts_web_compiler_bg\.[^.]+\.wasm$/.test(file),
  );
  const renderer = allFiles.filter((file) =>
    /^assets\/typst_ts_renderer_bg\.[^.]+\.wasm$/.test(file),
  );

  expect(compiler).toHaveLength(1);
  expect(renderer).toHaveLength(1);
  expect(`/org-zhixing-themes/${compiler[0]}`).toMatch(
    /^\/org-zhixing-themes\/assets\/typst_ts_web_compiler_bg\.[^.]+\.wasm$/,
  );
  expect(`/org-zhixing-themes/${renderer[0]}`).toMatch(
    /^\/org-zhixing-themes\/assets\/typst_ts_renderer_bg\.[^.]+\.wasm$/,
  );
  expect(readFileSync(join(outputDir, compiler[0]!)).byteLength).toBeGreaterThan(0);
  expect(readFileSync(join(outputDir, renderer[0]!)).byteLength).toBeGreaterThan(0);

  const staticSourceHtml = readdirSync(join(outputDir, "org-zhixing.sources"))
    .map((file) => readFileSync(join(outputDir, "org-zhixing.sources", file), "utf8"))
    .join("\n");
  expect(staticSourceHtml).toContain('class=\\"org-code-highlight\\"');
  expect(staticSourceHtml).toContain('class=\\"shiki ');
}, 30_000);

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

  it("uses the configured content directory when --content is absent", async () => {
    const root = mkdtempSync(join(tmpdir(), "org-zhixing-pages-config-content-"));
    roots.push(root);
    mkdirSync(join(root, "public", "blog"), { recursive: true });
    writeFileSync(
      join(root, "public", "site.toml"),
      '[site]\nbase_url = "https://example.test/project/"\n\n[content]\ncontent_dir = "blog"\n',
    );
    const options = parsePagesBuildArgs(
      ["--config", "public/site.toml", "--out", join(tmpdir(), "org-zhixing-pages-output")],
      root,
    );

    expect(options.contentDir).toBeNull();
    await expect(validatePagesBuildConfig(options)).resolves.toMatchObject({
      contentDir: join(root, "public", "blog"),
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

  it("normalizes every emitted shell to the isolated theme base path", async () => {
    const root = mkdtempSync(join(tmpdir(), "org-zhixing-spa-shells-"));
    roots.push(root);
    writeFileSync(join(root, "index.html"), "<html><head></head><body>index</body></html>");
    writeFileSync(
      join(root, "404.html"),
      '<html><head><base href="/stale/" /></head><body>fallback</body></html>',
    );

    expect(
      spaShellBasePath({
        ORG_ZHIXING_BASE_PATH: "/project/themes/elegant-blog",
        PUBLIC_BASE_PATH: "/wrong/",
      }),
    ).toBe("/project/themes/elegant-blog/");
    await normalizeSpaShells({
      basePath: "/project/themes/elegant-blog",
      distRoot: root,
    });

    for (const name of ["index.html", "404.html"]) {
      expect(readFileSync(join(root, name), "utf8")).toContain(
        '<base href="/project/themes/elegant-blog/" />',
      );
    }
  });

  it("materializes theme-local shells for every static content route", async () => {
    const root = mkdtempSync(join(tmpdir(), "org-zhixing-route-shells-"));
    roots.push(root);
    writeFileSync(
      join(root, "index.html"),
      '<html><head></head><body><div id="app"></div><script type="module" src="/project/assets/app.js"></script></body></html>',
    );
    writeFileSync(
      join(root, "org-zhixing.static.json"),
      JSON.stringify({
        blog: {
          articles: [
            { sourceId: "10-architecture-examples-poo-flow-runtime" },
            { sourceId: "10-architecture-examples-poo-flow-subflows" },
            { sourceId: "90-operations-90-05-typst-performance" },
            { sourceId: "10-architecture-10-03-router" },
          ],
        },
      }),
    );

    await expect(materializePagesRouteShells(root)).resolves.toBe(4);

    expect(
      readFileSync(join(root, "10-architecture-examples-poo-flow-runtime", "index.html"), "utf8"),
    ).toContain('data-theme-runtime-state="pending"');
    expect(
      readFileSync(join(root, "10-architecture-examples-poo-flow-subflows", "index.html"), "utf8"),
    ).toContain('data-theme-runtime-state="pending"');
    expect(
      readFileSync(join(root, "90-operations-90-05-typst-performance.html"), "utf8"),
    ).toContain('data-theme-runtime-state="pending"');
    expect(
      readFileSync(join(root, "90-operations-90-05-typst-performance", "index.html"), "utf8"),
    ).toContain('data-theme-runtime-state="pending"');
    expect(existsSync(join(root, "index", "index.html"))).toBe(false);
    for (const route of [
      "blogs",
      "gallery",
      "notes",
      "travel",
      "memory",
      "agenda",
      "capture",
      "diagnostics",
    ]) {
      expect(readFileSync(join(root, route, "index.html"), "utf8")).toContain(
        'data-theme-runtime-state="pending"',
      );
    }
    expect(readFileSync(join(root, "gallery", "index.html"), "utf8")).toContain(
      '<script type="module" src="/project/assets/app.js"></script>',
    );
  });

  it("rejects unsafe generated route identifiers", async () => {
    const root = mkdtempSync(join(tmpdir(), "org-zhixing-route-shells-"));
    roots.push(root);
    writeFileSync(join(root, "index.html"), "<html>theme shell</html>");
    writeFileSync(
      join(root, "org-zhixing.static.json"),
      JSON.stringify({ blog: { articles: [{ sourceId: "../outside" }] } }),
    );

    await expect(materializeStaticRouteShells(root)).rejects.toThrow("PAGES-E005");
  });
});
import { runPagesBuild } from "../packages/theme-tooling/src/pages-build.mjs";
