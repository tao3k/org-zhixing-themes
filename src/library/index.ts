/**
 * Public library facade for downstream Org Zhixing themes.
 *
 * Keep this barrel focused on stable data, config, render, and theme contracts.
 * App-shell modules such as routers, DOM bootstrapping, workers, and generated
 * assets should stay outside this boundary so themes can depend on the library
 * without inheriting the demo application runtime.
 */
export * from "../config";
export * from "../model";
export * from "../render";
export * from "../staticSiteData";
export * from "./builtinThemes";
export * from "./theme";
export * from "./themePackage";
export * from "./themeManifest";
export * from "./themeTokens";
export * from "./themeSlots";
export * from "./themeRegistry";
