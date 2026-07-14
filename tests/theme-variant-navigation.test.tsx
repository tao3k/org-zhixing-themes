import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { createThemeRegistry, parseSiteConfig, resolveConfiguredTheme } from "../src/library";
import { ThemeVariantNavigation } from "../src/react/ThemeVariantNavigation";
import {
  loadThemeVariantPreference,
  storeThemeVariantPreference,
  themeVariantStorageKey,
} from "../src/react/themeVariantPreference";
import documentsTheme from "@org-zhixing/theme-documents";
import minimalNotesTheme from "@org-zhixing/theme-minimal-notes";

const minimalTheme = () =>
  resolveConfiguredTheme(
    createThemeRegistry([minimalNotesTheme]),
    parseSiteConfig('theme = "minimal-notes"\ntheme_variant = "paper"'),
  );

describe("theme variant navigation", () => {
  it("renders theme-local color schemes without exposing theme switching", () => {
    const html = renderToStaticMarkup(
      <ThemeVariantNavigation
        activeVariantId="paper"
        onVariantChange={() => undefined}
        theme={minimalTheme()}
      />,
    );

    expect(html).toContain('aria-label="Theme color scheme"');
    expect(html).toContain('data-theme-variant-option="paper"');
    expect(html).toContain('data-theme-variant-option="midnight"');
    expect(html).toContain('aria-pressed="true"');
    expect(html).not.toContain("elegant-blog");
  });

  it("persists a valid preference per theme and ignores storage failures", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    };
    storeThemeVariantPreference("minimal-notes", "midnight", storage);

    expect(loadThemeVariantPreference(minimalTheme(), "paper", storage)).toBe("midnight");
    expect(themeVariantStorageKey("minimal-notes")).not.toBe(
      themeVariantStorageKey("elegant-blog"),
    );
    expect(
      loadThemeVariantPreference(minimalTheme(), "paper", {
        getItem: () => {
          throw new Error("blocked");
        },
        setItem: vi.fn(),
      }),
    ).toBe("paper");
  });

  it("exposes all four Catppuccin flavors inside Documents", () => {
    const theme = resolveConfiguredTheme(
      createThemeRegistry([documentsTheme]),
      parseSiteConfig('theme = "documents"\ntheme_variant = "mocha"'),
    );
    const html = renderToStaticMarkup(
      <ThemeVariantNavigation
        activeVariantId="mocha"
        onVariantChange={() => undefined}
        theme={theme}
      />,
    );

    for (const flavor of ["latte", "frappe", "macchiato", "mocha"]) {
      expect(html).toContain(`data-theme-variant-option="${flavor}"`);
    }
  });
});
