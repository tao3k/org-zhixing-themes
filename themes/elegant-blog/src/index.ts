import { defineThemePackage } from "../../../src/library/themePackage";
import { createElement } from "react";
import { defineReactSpaThemeBinding } from "../../../src/react/themeBinding";
import "./theme.css";

export default defineThemePackage({
  manifest: {
    schemaVersion: 1,
    id: "elegant-blog",
    package: "@org-zhixing/theme-elegant-blog",
    version: "0.1.0",
    displayName: "Elegant Blog",
    engine: ">=0.1 <0.2",
    defaultVariant: "default",
    variants: ["default"],
    capabilities: ["blog", "agenda", "gallery", "notes", "travel"],
    publicSlots: [
      {
        id: "site-header",
        strategies: ["wrap", "replace"],
        runtime: "universal",
        stability: "stable",
      },
      {
        id: "site-hero",
        strategies: ["wrap", "replace"],
        runtime: "universal",
        stability: "stable",
      },
      {
        id: "runtime-state",
        strategies: ["wrap", "replace"],
        runtime: "client",
        stability: "stable",
      },
      { id: "blog-index", strategies: ["wrap"], runtime: "client", stability: "stable" },
    ],
    renderers: { "react-spa": { export: ".", serverComponents: false } },
    renderModes: ["static"],
  },
  variants: [
    {
      id: "default",
      label: "Elegant Light",
      tokens: {
        color: {
          canvas: "var(--slate-1)",
          surface: "#ffffff",
          text: "var(--slate-12)",
          accent: "var(--blue-11)",
        },
        typography: {
          body: '"Inter Variable", ui-sans-serif, system-ui, sans-serif',
          heading: '"Inter Variable", ui-sans-serif, system-ui, sans-serif',
          mono: '"Roboto Mono", ui-monospace, monospace',
        },
        spacing: { xs: "4px", sm: "8px", md: "16px", lg: "32px" },
      },
    },
  ],
  rendererBindings: {
    "react-spa": defineReactSpaThemeBinding({
      kind: "org-zhixing/react-spa/v1",
      slots: {
        "blog-index": {
          strategy: "wrap",
          component: ({ children }) =>
            createElement(
              "div",
              {
                className: "theme-blog-index theme-blog-index--elegant",
                "data-theme-layout": "elegant-blog/blog-index",
              },
              children,
            ),
        },
      },
    }),
  },
  layouts: {
    default: ({ document, route }, api) =>
      api.renderView({
        view: route.view ?? "blog",
        document: document ?? null,
      }),
  },
});
