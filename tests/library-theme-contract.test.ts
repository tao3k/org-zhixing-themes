import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  applyThemeConfig,
  applyThemeVariant,
  createDocumentView,
  createDefaultThemeRegistry,
  createThemeRegistry,
  defineTheme,
  defineThemePackage,
  parseSiteConfig,
  registerTheme,
  resolveConfiguredTheme,
  renderThemeLayout,
  renderThemeSlot,
  renderView,
  resolveTheme,
  themePackageManifestFor,
  themeNames,
  themeTokenCssVariables,
  validateThemeSlotManifest,
  type ThemeApi,
} from "../src/library";
import { record } from "./modelFixtures";
import { generatedThemeCatalog, generatedThemeEntries } from "../src/generated/themeRegistry";
import minimalNotesTheme from "@org-zhixing/theme-minimal-notes";
import documentsTheme from "@org-zhixing/theme-documents";

const testThemeApi: ThemeApi = {
  renderView,
  publicAssetUrl: (path) => new URL(path, "https://example.test/"),
};

describe("Org Zhixing library theme contract", () => {
  it("discovers built-in themes from workspace package manifests", () => {
    const elegantBlogPackage = JSON.parse(readFileSync("themes/elegant-blog/package.json", "utf8"));
    expect(elegantBlogPackage.orgZhixing).toMatchObject({
      schemaVersion: 1,
      id: "elegant-blog",
      defaultVariant: "default",
      variants: ["default"],
      renderModes: ["static"],
    });
    expect(generatedThemeCatalog.map(({ id }) => id)).toEqual([
      "documents",
      "elegant-blog",
      "minimal-notes",
    ]);
    expect(generatedThemeEntries.map(([id, theme]) => [id, theme.name])).toEqual([
      ["elegant-blog", "elegant-blog"],
    ]);
    expect(
      resolveConfiguredTheme(
        createThemeRegistry([minimalNotesTheme]),
        parseSiteConfig('theme = "minimal-notes"\ntheme_variant = "paper"'),
      ).name,
    ).toBe("minimal-notes");
  });

  it("ships Documents as a Catppuccin multi-flavor documentation theme", () => {
    expect(documentsTheme.manifest).toMatchObject({
      id: "documents",
      defaultVariant: "mocha",
      variants: ["latte", "frappe", "macchiato", "mocha"],
      capabilities: expect.arrayContaining(["docs", "org-roam", "backlinks", "graph"]),
    });
    expect(documentsTheme.variants?.map(({ id }) => id)).toEqual([
      "latte",
      "frappe",
      "macchiato",
      "mocha",
    ]);
    expect(documentsTheme.variants?.find(({ id }) => id === "mocha")?.tokens.color).toEqual({
      canvas: "#1e1e2e",
      surface: "#313244",
      text: "#cdd6f4",
      accent: "#cba6f7",
    });
  });

  it("lets downstream themes render through the public library entrypoint", async () => {
    const site = parseSiteConfig(`
      theme = "contract-theme"

      [site]
      title = "Downstream Notes"

      [content]
      root = "content"
      default_source = "notes"

      [[content.sources]]
      id = "notes"
      title = "Notes"
      file = "notes.org"
    `);
    const document = createDocumentView([
      record({
        effectiveTags: ["record"],
        title: "Theme contract note",
      }),
    ]);
    const theme = defineTheme({
      name: "contract-theme",
      layouts: {
        index: ({ site: siteConfig, document }, api) => ({
          html: `<h1>${siteConfig.title}</h1>${api.renderView({
            view: "records",
            document: document ?? null,
          })}`,
          assets: { assets: [{ path: "styles/theme.css", kind: "style" }] },
        }),
      },
    });

    const rendered = await renderThemeLayout(
      theme,
      "index",
      {
        site,
        route: { kind: "index", path: "/" },
        document,
        staticSite: null,
      },
      testThemeApi,
    );

    expect(site.sources[0]?.sourceFile).toBe("content/notes.org");
    expect(site.theme.id).toBe("contract-theme");
    expect(site.theme.variant).toBe("default");
    expect(rendered.status).toBe(200);
    expect(rendered.assets?.assets).toEqual([{ path: "styles/theme.css", kind: "style" }]);
    expect(rendered.html).toContain("Downstream Notes");
    expect(rendered.html).toContain("Theme contract note");
  });

  it("falls back to a default layout when a route-specific layout is absent", async () => {
    const site = parseSiteConfig("");
    const theme = defineTheme({
      name: "fallback-theme",
      layouts: {
        default: ({ route }) => `fallback:${route.kind}:${route.path}`,
      },
    });

    await expect(
      renderThemeLayout(
        theme,
        "post",
        { site, route: { kind: "post", path: "/posts/1", rangeStart: 1 } },
        testThemeApi,
      ),
    ).resolves.toEqual({ html: "fallback:post:/posts/1", status: 200 });
  });

  it("reports missing layouts as a theme contract error", async () => {
    const site = parseSiteConfig("");
    const theme = defineTheme({
      name: "empty-theme",
      layouts: {},
    });

    await expect(
      renderThemeLayout(
        theme,
        "index",
        { site, route: { kind: "index", path: "/" } },
        testThemeApi,
      ),
    ).rejects.toThrow('theme "empty-theme" does not define a "index" layout');
  });

  it("registers downstream themes by name and applies theme config extensions", () => {
    const site = parseSiteConfig(`
      theme = "downstream-theme"
      theme_variant = "default"

      [theme_config]
      accent = "ochre"
    `);
    const registry = createThemeRegistry([
      defineTheme({
        name: "nano-docs",
        layouts: {
          default: () => "docs",
        },
      }),
    ]);
    const downstreamTheme = defineTheme({
      name: "downstream-theme",
      layouts: {
        default: () => "downstream",
      },
      extendConfig: (config) => ({
        ...config,
        title: `${config.title} / downstream`,
        basePath: "/notes",
      }),
    });
    const nextRegistry = registerTheme(registry, downstreamTheme);
    const configured = applyThemeConfig(resolveConfiguredTheme(nextRegistry, site), site);

    expect(themeNames(nextRegistry)).toEqual(["downstream-theme", "nano-docs"]);
    expect(site.theme.config).toEqual({ accent: "ochre" });
    expect(configured.title).toBe("Org Zhixing / downstream");
    expect(configured.basePath).toBe("/notes");
    expect(registry.has("downstream-theme")).toBe(false);
  });

  it("provides a default registry backed by the existing Elegant Blog renderer", async () => {
    const site = parseSiteConfig("");
    const document = createDocumentView([
      record({
        effectiveTags: ["record"],
        title: "Default theme note",
      }),
    ]);
    const registry = createDefaultThemeRegistry();
    const theme = resolveConfiguredTheme(registry, site);
    const rendered = await renderThemeLayout(
      theme,
      "page",
      {
        site,
        route: { kind: "page", path: "/records", view: "records" },
        document,
      },
      testThemeApi,
    );

    expect(theme.name).toBe("elegant-blog");
    expect(rendered.html).toContain("Default theme note");
  });

  it("rejects ambiguous theme registry entries", () => {
    const theme = defineTheme({
      name: "duplicate-theme",
      layouts: {
        default: () => "duplicate",
      },
    });

    expect(() => createThemeRegistry([theme, theme])).toThrow(
      'THEME-E002 duplicate theme id "duplicate-theme"',
    );
    expect(() => resolveTheme(createThemeRegistry(), "missing-theme")).toThrow(
      'THEME-E001 unknown theme "missing-theme"',
    );
  });

  it("rejects legacy theme tables with a canonical migration diagnostic", () => {
    expect(() =>
      parseSiteConfig(`
        [theme]
        name = "elegant-blog"
      `),
    ).toThrow("THEME-E011 legacy [theme] is not supported");
  });

  it("rejects variants that are not declared by the selected theme", () => {
    const site = parseSiteConfig(`
      theme = "elegant-blog"
      theme_variant = "midnight"
    `);

    expect(() => resolveConfiguredTheme(createDefaultThemeRegistry(), site)).toThrow(
      'THEME-E005 unknown variant "midnight" for theme "elegant-blog"; available: default',
    );
  });

  it("turns a downstream theme package manifest into a registry theme", async () => {
    const theme = defineThemePackage({
      manifest: {
        schemaVersion: 1,
        id: " artisan-notes ",
        package: " @example/artisan-notes-theme ",
        version: "0.1.0",
        displayName: "Artisan Notes",
        engine: ">=0.1 <0.2",
        defaultVariant: "paper",
        variants: ["paper"],
        capabilities: ["blog"],
        publicSlots: [
          {
            id: "site-header",
            strategies: ["wrap", "replace"],
            runtime: "universal",
            stability: "stable",
          },
        ],
        renderers: { library: { export: "." } },
        renderModes: ["static"],
        assets: {
          assets: [{ path: "assets/artisan.css", kind: "style" }],
        },
      },
      variants: [
        {
          id: "paper",
          tokens: {
            color: { canvas: "#fff", surface: "#fff", text: "#111", accent: "#a50" },
            typography: { body: "sans-serif", heading: "serif", mono: "monospace" },
            spacing: { xs: "2px", sm: "4px", md: "8px", lg: "16px" },
          },
        },
      ],
      layouts: {
        index: ({ site }) => `<main>${site.title}</main>`,
      },
    });
    const registry = createThemeRegistry([theme]);
    const rendered = await renderThemeLayout(
      resolveTheme(registry, "artisan-notes"),
      "index",
      { site: parseSiteConfig(""), route: { kind: "index", path: "/" } },
      testThemeApi,
    );

    expect(themePackageManifestFor(theme)).toEqual({
      schemaVersion: 1,
      id: "artisan-notes",
      package: "@example/artisan-notes-theme",
      version: "0.1.0",
      displayName: "Artisan Notes",
      engine: ">=0.1 <0.2",
      defaultVariant: "paper",
      variants: ["paper"],
      capabilities: ["blog"],
      publicSlots: [
        {
          id: "site-header",
          strategies: ["wrap", "replace"],
          runtime: "universal",
          stability: "stable",
        },
      ],
      renderers: { library: { export: "." } },
      renderModes: ["static"],
      assets: {
        assets: [{ path: "assets/artisan.css", kind: "style" }],
      },
    });
    expect(rendered.assets?.assets).toEqual([{ path: "assets/artisan.css", kind: "style" }]);
    expect(rendered.html).toContain("Org Zhixing");
  });

  it("applies a selected variant as stable semantic CSS variables", () => {
    const site = parseSiteConfig(`
      theme = "minimal-notes"
      theme_variant = "midnight"
    `);
    const theme = resolveConfiguredTheme(createThemeRegistry([minimalNotesTheme]), site);
    const properties = new Map<string, string>();
    const dataset: Record<string, string> = {};

    const variant = applyThemeVariant(theme, site.theme.variant, {
      dataset,
      style: { setProperty: (name, value) => properties.set(name, value ?? "") },
    });

    expect(theme.name).toBe("minimal-notes");
    expect(variant.id).toBe("midnight");
    expect(dataset).toEqual({ theme: "minimal-notes", themeVariant: "midnight" });
    expect(properties.get("--surface-canvas")).toBe("#111318");
    expect(properties.get("--face-salient")).toBe("#8fb8ff");
    expect(themeTokenCssVariables(variant.tokens)["--font-heading"]).toContain("serif");
  });

  it("composes stable slots through explicit wrap and replace strategies", () => {
    const original = ({ title }: { title: string }) => `<header>${title}</header>`;

    expect(
      renderThemeSlot({ title: "Notes" }, original, {
        strategy: "wrap",
        render: (_context, output) => `<aside>${output}</aside>`,
      }),
    ).toBe("<aside><header>Notes</header></aside>");
    expect(
      renderThemeSlot({ title: "Notes" }, original, {
        strategy: "replace",
        render: ({ title }) => `<nav>${title}</nav>`,
      }),
    ).toBe("<nav>Notes</nav>");
    expect(() =>
      validateThemeSlotManifest({
        id: "private-header",
        strategies: ["replace"],
        runtime: "universal",
        stability: "stable",
      }),
    ).toThrow('THEME-E009 unknown stable theme slot "private-header"');
  });
});
