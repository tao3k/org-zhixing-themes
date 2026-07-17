import elegantBlog from "../../elegant-blog/src/index";

const themeGallery = {
  ...elegantBlog,
  name: "theme-gallery",
  rendererBindings: {
    ...elegantBlog.rendererBindings,
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
  manifest: {
    ...elegantBlog.manifest,
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
};

export default themeGallery;
