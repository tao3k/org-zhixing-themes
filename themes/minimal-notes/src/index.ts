import { defineThemePackage } from "../../../src/library/themePackage";
import { createElement } from "react";
import { defineReactSpaThemeBinding } from "../../../src/react/themeBinding";
import "./theme.css";

const systemSans = "ui-sans-serif, system-ui, sans-serif";
const systemMono = "ui-monospace, monospace";

export default defineThemePackage({
  manifest: {
    schemaVersion: 1,
    id: "minimal-notes",
    package: "@org-zhixing/theme-minimal-notes",
    version: "0.1.0",
    displayName: "Minimal Notes",
    engine: ">=0.1 <0.2",
    defaultVariant: "paper",
    variants: ["paper", "midnight"],
    capabilities: ["blog", "notes", "search"],
    publicSlots: [
      {
        id: "site-header",
        strategies: ["wrap", "replace"],
        runtime: "universal",
        stability: "stable",
      },
      { id: "site-hero", strategies: ["replace"], runtime: "universal", stability: "stable" },
      { id: "blog-index", strategies: ["wrap"], runtime: "client", stability: "stable" },
    ],
    renderers: { "react-spa": { export: ".", serverComponents: false } },
    renderModes: ["static"],
  },
  variants: [
    {
      id: "paper",
      label: "Paper",
      tokens: {
        color: { canvas: "#f4f1e8", surface: "#fffdf7", text: "#24211b", accent: "#8a4b2a" },
        typography: { body: systemSans, heading: "ui-serif, Georgia, serif", mono: systemMono },
        spacing: { xs: "3px", sm: "7px", md: "14px", lg: "28px" },
      },
    },
    {
      id: "midnight",
      label: "Midnight",
      tokens: {
        color: { canvas: "#111318", surface: "#191c22", text: "#e7e9ee", accent: "#8fb8ff" },
        typography: { body: systemSans, heading: "ui-serif, Georgia, serif", mono: systemMono },
        spacing: { xs: "3px", sm: "7px", md: "14px", lg: "28px" },
      },
    },
  ],
  rendererBindings: {
    "react-spa": defineReactSpaThemeBinding({
      kind: "org-zhixing/react-spa/v1",
      slots: {
        "site-hero": {
          strategy: "replace",
          component: ({ title }) =>
            createElement(
              "section",
              { className: "site-hero site-hero--minimal", "data-theme-slot": "site-hero" },
              createElement("h1", { id: "site-title" }, title),
            ),
        },
        "blog-index": {
          strategy: "wrap",
          component: ({ children }) =>
            createElement(
              "section",
              {
                className: "theme-blog-index theme-blog-index--minimal",
                "data-theme-layout": "minimal-notes/blog-index",
              },
              children,
            ),
        },
      },
    }),
  },
  layouts: {
    default: ({ document, route }, api) =>
      api.renderView({ view: route.view ?? "blog", document: document ?? null }),
  },
});
