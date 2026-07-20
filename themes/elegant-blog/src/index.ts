import { defineThemePackage } from "../../../src/library/themePackage";
import {
  elegantBlogLayouts,
  elegantBlogManifestFoundation,
  elegantBlogRendererBindings,
  elegantBlogVariants,
} from "./foundation";

export default defineThemePackage({
  manifest: {
    ...elegantBlogManifestFoundation,
    id: "elegant-blog",
    package: "@org-zhixing/theme-elegant-blog",
    displayName: "Elegant Blog",
    capabilities: ["blog", "agenda", "gallery", "notes", "travel"],
  },
  variants: elegantBlogVariants,
  rendererBindings: elegantBlogRendererBindings,
  layouts: elegantBlogLayouts,
});
