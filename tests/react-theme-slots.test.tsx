import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  createDefaultThemeRegistry,
  createThemeRegistry,
  parseSiteConfig,
  resolveConfiguredTheme,
} from "../src/library";
import { renderReactSpaThemeSlot } from "../src/react/themeBinding";
import minimalNotesTheme from "@org-zhixing/theme-minimal-notes";

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

  it("gives each installed theme a distinct blog-index layout owner", () => {
    const registry = createDefaultThemeRegistry();
    const minimal = resolveConfiguredTheme(
      registry,
      parseSiteConfig('theme = "minimal-notes"\ntheme_variant = "paper"'),
    );
    const elegant = resolveConfiguredTheme(registry, parseSiteConfig('theme = "elegant-blog"'));
    const original = <div className="blog-index">articles</div>;

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
});
