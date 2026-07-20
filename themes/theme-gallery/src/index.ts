import { defineThemePackage } from "../../../src/library/themePackage";
import {
  elegantBlogLayouts,
  elegantBlogManifestFoundation,
  elegantBlogRendererBindings,
  elegantBlogVariants,
} from "../../elegant-blog/src/foundation";

export default defineThemePackage({
  manifest: {
    ...elegantBlogManifestFoundation,
    id: "theme-gallery",
    package: "@org-zhixing/theme-gallery",
    displayName: "Theme Gallery",
    capabilities: ["blog", "theme-preview"],
    content: {
      base: "workspace",
      directory: "blog",
      routeMode: "blog",
    },
  },
  variants: elegantBlogVariants,
  rendererBindings: {
    ...elegantBlogRendererBindings,
    navigation: [
      {
        name: "Documents",
        description: "technical documentation",
        href: "themes/documents/",
      },
      {
        name: "Elegant Blog",
        description: "editorial blog",
        href: "themes/elegant-blog/",
      },
      {
        name: "Minimal Notes",
        description: "minimal knowledge notes",
        href: "themes/minimal-notes/",
      },
    ],
  },
  layouts: elegantBlogLayouts,
});
