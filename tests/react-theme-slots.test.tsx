import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ZhixingTheme } from "../src/library";
import {
  createDefaultThemeRegistry,
  createThemeRegistry,
  parseSiteConfig,
  resolveConfiguredTheme,
} from "../src/library";
import { renderReactSpaThemeSlot } from "../src/react/themeBinding";
import { shouldShowSiteHero } from "../src/react/ThemeRootLayout";
import type { ContentShellData } from "../src/services/contentServices";
import minimalNotesTheme from "@org-zhixing/theme-minimal-notes";
import documentsTheme from "@org-zhixing/theme-documents";
import elegantBlogTheme from "@org-zhixing/theme-elegant-blog";

describe("React SPA theme slots", () => {
  it("renders a structural replacement from the selected workspace theme", () => {
    const theme = resolveConfiguredTheme(
      createThemeRegistry([minimalNotesTheme]),
      parseSiteConfig('theme = "minimal-notes"\ntheme_variant = "paper"'),
    );
    const output = renderToStaticMarkup(
      renderReactSpaThemeSlot(
        theme,
        "site-hero",
        { title: "Field Notes" },
        <section className="site-hero">original</section>,
      ),
    );

    expect(output).toContain('data-theme-slot="site-hero"');
    expect(output).toContain("Field Notes");
    expect(output).not.toContain("original");
  });

  it("keeps the adapter fallback when a theme has no override", () => {
    const theme = resolveConfiguredTheme(
      createDefaultThemeRegistry(),
      parseSiteConfig('theme = "elegant-blog"'),
    );
    expect(
      renderToStaticMarkup(
        renderReactSpaThemeSlot(theme, "site-hero", { title: "Elegant" }, <h1>fallback</h1>),
      ),
    ).toBe("<h1>fallback</h1>");
  });

  it("renders a documentation navigation surface in the docs theme", () => {
    const output = renderToStaticMarkup(
      renderReactSpaThemeSlot(
        documentsTheme,
        "site-hero",
        { title: "Knowledge Graph" },
        <section>fallback</section>,
      ),
    );

    expect(output).not.toContain("DOCUMENTATION");
    expect(output).toContain("Search docs");
    expect(output).toContain("Documentation home");
    expect(output).toContain('id="documents-workspace-dock"');
    expect(output).not.toContain("indexed Org documents");
    expect(output).not.toContain("Local graph");
    expect(output).not.toContain("[[Documentation index]]");
    expect(output).not.toContain("fallback");
  });

  it("keeps blog-index layout ownership out of the documentation scenario", () => {
    const registry = createThemeRegistry([documentsTheme, elegantBlogTheme, minimalNotesTheme]);
    const minimal = resolveConfiguredTheme(
      registry,
      parseSiteConfig('theme = "minimal-notes"\ntheme_variant = "paper"'),
    );
    const elegant = resolveConfiguredTheme(registry, parseSiteConfig('theme = "elegant-blog"'));
    const docs = resolveConfiguredTheme(
      registry,
      parseSiteConfig('theme = "documents"\ntheme_variant = "mocha"'),
    );
    const original = <div className="blog-index">articles</div>;

    expect(
      renderToStaticMarkup(
        renderReactSpaThemeSlot(docs, "blog-index", { shell: {} as never }, original),
      ),
    ).toBe('<div class="blog-index">articles</div>');
    expect(
      renderToStaticMarkup(
        renderReactSpaThemeSlot(minimal, "blog-index", { shell: {} as never }, original),
      ),
    ).toContain('data-theme-layout="minimal-notes/blog-index"');
    expect(
      renderToStaticMarkup(
        renderReactSpaThemeSlot(elegant, "blog-index", { shell: {} as never }, original),
      ),
    ).toContain('data-theme-layout="elegant-blog/blog-index"');
  });

  it("keeps the documents navigation slot visible on document article routes", () => {
    const registry = createThemeRegistry([documentsTheme, elegantBlogTheme, minimalNotesTheme]);
    const shell = {
      siteConfig: parseSiteConfig('theme = "documents"\ntheme_variant = "mocha"'),
      staticSite: { sources: [] },
    } as unknown as ContentShellData;
    const docs = resolveConfiguredTheme(registry, shell.siteConfig);
    const blog = resolveConfiguredTheme(registry, parseSiteConfig('theme = "elegant-blog"'));

    expect(shouldShowSiteHero("/10-architecture-examples-poo-flow-subflows", shell, docs)).toBe(
      true,
    );
    expect(shouldShowSiteHero("/10-architecture-examples-poo-flow-subflows", shell, blog)).toBe(
      false,
    );
  });

  it("does not concatenate a page-owned home hero into another application route", () => {
    const shell = {
      siteConfig: parseSiteConfig('theme = "documents"\ntheme_variant = "mocha"'),
      staticSite: { sources: [] },
    } as unknown as ContentShellData;
    const applicationTheme = {
      name: "application",
      rendererBindings: {
        "react-spa": {
          kind: "org-zhixing/react-spa/v1",
          contentRoutes: {
            exclusiveContentRoutes: true,
            loadDocument: async () => null,
            renderDocument: () => null,
            renderHome: () => null,
          },
        },
      },
    } as unknown as ZhixingTheme;

    expect(shouldShowSiteHero("/principles", shell, applicationTheme)).toBe(false);
  });
});
