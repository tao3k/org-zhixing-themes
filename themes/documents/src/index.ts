import { createElement, type ReactNode } from "react";
import { defineThemePackage } from "../../../src/library/themePackage";
import { defineReactSpaThemeBinding } from "../../../src/react/themeBinding";
import type { ContentShellData } from "../../../src/services/contentServices";
import "./theme.css";
import "./poo-flow.css";
import { documentsContentRoutes } from "./contentRoutes";
import { DocumentsHeader } from "./DocumentsHeader";
import { DocumentsNavigation } from "./DocumentsNavigation";
import { DocumentsControlCenter } from "./DocumentsControlCenter";

export { documentsNavigationGroups } from "./DocumentsNavigation";
export {
  linkedDocumentId,
  linkedNotesStayExpanded,
  openLinkedNoteState,
} from "./LinkedNoteWorkspace";

const systemSans = "Inter, ui-sans-serif, system-ui, sans-serif";
const systemMono = "Roboto Mono, ui-monospace, SFMono-Regular, monospace";

const DocumentsRuntimeState = ({ shell }: { shell: ContentShellData }): ReactNode =>
  createElement(
    "div",
    {
      className: "runtime-state documents-runtime-state",
      "aria-hidden": "true",
    },
    createElement("strong", null, `${shell.staticSite?.sources.length ?? 0} documents`),
    createElement("small", null, "docs/ · Org source of truth"),
  );

export default defineThemePackage({
  manifest: {
    schemaVersion: 1,
    id: "documents",
    package: "@org-zhixing/theme-documents",
    version: "0.1.0",
    displayName: "Documents",
    engine: ">=0.1 <0.2",
    defaultVariant: "mocha",
    variants: ["latte", "frappe", "macchiato", "mocha"],
    capabilities: ["docs", "search", "org-roam", "backlinks", "graph"],
    content: { base: "workspace", directory: "docs", routeMode: "documents" },
    publicSlots: [
      {
        id: "site-header",
        strategies: ["replace"],
        runtime: "universal",
        stability: "stable",
      },
      {
        id: "site-hero",
        strategies: ["replace"],
        runtime: "universal",
        stability: "stable",
      },
      {
        id: "runtime-state",
        strategies: ["replace"],
        runtime: "universal",
        stability: "stable",
      },
      {
        id: "theme-controls",
        strategies: ["replace"],
        runtime: "client",
        stability: "stable",
      },
    ],
    renderers: { "react-spa": { export: ".", serverComponents: false } },
    renderModes: ["static"],
  },
  variants: [
    {
      id: "latte",
      label: "Latte",
      tokens: {
        color: {
          canvas: "#eff1f5",
          surface: "#e6e9ef",
          text: "#4c4f69",
          accent: "#8839ef",
        },
        typography: { body: systemSans, heading: systemSans, mono: systemMono },
        spacing: { xs: "4px", sm: "8px", md: "16px", lg: "32px" },
      },
    },
    {
      id: "frappe",
      label: "Frappé",
      tokens: {
        color: {
          canvas: "#303446",
          surface: "#414559",
          text: "#c6d0f5",
          accent: "#ca9ee6",
        },
        typography: { body: systemSans, heading: systemSans, mono: systemMono },
        spacing: { xs: "4px", sm: "8px", md: "16px", lg: "32px" },
      },
    },
    {
      id: "macchiato",
      label: "Macchiato",
      tokens: {
        color: {
          canvas: "#24273a",
          surface: "#363a4f",
          text: "#cad3f5",
          accent: "#c6a0f6",
        },
        typography: { body: systemSans, heading: systemSans, mono: systemMono },
        spacing: { xs: "4px", sm: "8px", md: "16px", lg: "32px" },
      },
    },
    {
      id: "mocha",
      label: "Mocha",
      tokens: {
        color: {
          canvas: "#1e1e2e",
          surface: "#313244",
          text: "#cdd6f4",
          accent: "#cba6f7",
        },
        typography: { body: systemSans, heading: systemSans, mono: systemMono },
        spacing: { xs: "4px", sm: "8px", md: "16px", lg: "32px" },
      },
    },
  ],
  rendererBindings: {
    "react-spa": defineReactSpaThemeBinding({
      kind: "org-zhixing/react-spa/v1",
      contentRoutes: documentsContentRoutes,
      slots: {
        "site-header": { strategy: "replace", component: DocumentsHeader },
        "site-hero": { strategy: "replace", component: DocumentsNavigation },
        "runtime-state": {
          strategy: "replace",
          component: DocumentsRuntimeState,
        },
        "theme-controls": {
          strategy: "replace",
          component: DocumentsControlCenter,
        },
      },
    }),
  },
  layouts: {
    default: ({ document, route }, api) =>
      api.renderView({
        view: route.view ?? "records",
        document: document ?? null,
      }),
  },
});
