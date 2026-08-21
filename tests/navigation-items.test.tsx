import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createThemeRegistry } from "../src/library";
import { NavigationItems } from "../src/react/NavigationItems";
import type { ContentShellData } from "../src/services/contentServices";
import {
  ThemeRuntimeProvider,
  type ThemeRuntime,
} from "../src/theme-system/react/ThemeRuntimeProvider";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("theme navigation", () => {
  it("renders every registered theme route beneath the Themes menu", () => {
    vi.stubGlobal("__ORG_ZHIXING_BASE_PATH__", "/org-zhixing-themes/");
    vi.stubGlobal("__webpack_public_path__", "/org-zhixing-themes/assets/");
    const runtime = {
      isolationId: "navigation-test",
      registry: createThemeRegistry([]),
      selectedTheme: {
        rendererBindings: {
          navigation: [
            {
              name: "Themes",
              children: [
                { name: "Documents", href: "themes/documents/" },
                { name: "Elegant Blog", href: "themes/elegant-blog/" },
                { name: "Minimal Notes", href: "themes/minimal-notes/" },
              ],
            },
          ],
        },
      },
      selection: {
        defaultVariant: "default",
        id: "theme-gallery",
        package: "@org-zhixing/theme-gallery",
        transport: { kind: "workspace", module: "theme-gallery" },
        variants: ["default"],
      },
    } as unknown as ThemeRuntime;

    const output = renderToStaticMarkup(
      <ThemeRuntimeProvider runtime={runtime}>
        <NavigationItems shell={{ siteConfig: { menu: [] } } as unknown as ContentShellData} />
      </ThemeRuntimeProvider>,
    );

    expect(output).toContain('data-theme-navigation-group="Themes"');
    expect(output).toContain("<details");
    expect(output).toContain('<summary class="site-nav-group-label">');
    expect(output).toContain('data-theme-navigation-item="Documents"');
    expect(output).toContain('href="/org-zhixing-themes/themes/documents/"');
    expect(output).toContain('data-theme-navigation-item="Elegant Blog"');
    expect(output).toContain('href="/org-zhixing-themes/themes/elegant-blog/"');
    expect(output).toContain('data-theme-navigation-item="Minimal Notes"');
    expect(output).toContain('href="/org-zhixing-themes/themes/minimal-notes/"');

    const group = output.match(
      /<details[^>]*data-theme-navigation-group="Themes"[\s\S]*?<\/details>/,
    )?.[0];
    expect(group).toBeDefined();
    expect((group?.match(/data-theme-navigation-item=/g) ?? []).length).toBe(3);
    const hrefs = [...output.matchAll(/href="([^"]+)"/g)].map(([, href]) => href);
    expect(hrefs).toEqual([
      "/org-zhixing-themes/themes/documents/",
      "/org-zhixing-themes/themes/elegant-blog/",
      "/org-zhixing-themes/themes/minimal-notes/",
    ]) {
      expect(new URL(href, "https://tao3k.github.io/org-zhixing-themes/").pathname).toBe(href);
    }
    expect(output).not.toContain("/org-zhixing-themes/assets/themes/");
    expect(
      [
        "/org-zhixing-themes/themes/documents/",
        "/org-zhixing-themes/themes/elegant-blog/",
        "/org-zhixing-themes/themes/minimal-notes/",
      ].some((href) => href.startsWith("/org-zhixing-themes/assets/")),
    ).toBe(false);
  });
});
