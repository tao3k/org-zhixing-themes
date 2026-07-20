import { RouterProvider } from "@tanstack/react-router";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { attachmentGalleryFromSources } from "../src/attachmentGalleryModel";
import { createThemeRegistry, defineTheme, type ZhixingTheme } from "../src/library";
import { createOrgZhixingRouter } from "../src/react/router";
import {
  ThemeRuntimeProvider,
  type ThemeRuntime,
} from "../src/theme-system/react/ThemeRuntimeProvider";
import type {
  StaticGalleryData,
  StaticGallerySummary,
  StaticSiteData,
  StaticSourceProjection,
} from "../src/staticSiteData";
import { record, sectionRecord, sourceRange } from "./modelFixtures";
import { staticProjection } from "./staticProjection.fixture";

const reactActGlobal = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT: boolean;
};
reactActGlobal.IS_REACT_ACT_ENVIRONMENT = true;

const configText = `
[site]
title = "知行合一"
locale = "zh-CN"

[content]
content_dir = "blog"

[ui]
default_view = "gallery"
show_timings = true

[[ui.views]]
id = "blog"
label = "Blogs"
weight = 10

[[ui.views]]
id = "gallery"
label = "Gallery"
weight = 18

[[ui.views]]
id = "records"
label = "Notes"
weight = 20

[[ui.views]]
id = "memory"
label = "Memory"
weight = 25

[[ui.views]]
id = "travel"
label = "Travel"
weight = 28

[[ui.views]]
id = "agenda"
label = "Agenda"
weight = 30

[behavior]
lazy_lint = true

[attachments]
attach_id_dir = ".attach"
check_vcs = false
check_annex = false
scan_orphans = false

[agenda]
start = "2026-05-15"
days = 7
limit = 32
mode = "classic"
`;

describe("Org Zhixing React Router app", () => {
  let mountedRoot: Root | null = null;

  afterEach(() => {
    if (mountedRoot) {
      act(() => mountedRoot?.unmount());
      mountedRoot = null;
    }
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
    window.history.replaceState(null, "", "/");
  });

  it("renders site-wide projections from path routes without legacy query state", async () => {
    const router = await mountStaticRouter("/gallery");

    await waitForText("2 image items");
    expect(window.location.pathname).toBe("/gallery");
    expect(window.location.search).toBe("");
    expect(appView()).toBe("gallery");
    expect(document.querySelectorAll(".attachment-card")).toHaveLength(2);
    expect(document.body.textContent).toContain("across 3 Org sources");

    await navigateTo(router, "/notes");
    await waitForText("2 indexed notes from 2 Org sources");
    expect(window.location.pathname).toBe("/notes");
    expect(window.location.search).toBe("");
    expect(appView()).toBe("records");
    expect(document.querySelectorAll(".org-record-render")).toHaveLength(2);

    await navigateTo(router, "/travel");
    await waitForText("2 Org headings projected from 1 source files");
    expect(window.location.pathname).toBe("/travel");
    expect(window.location.search).toBe("");
    expect(appView()).toBe("travel");
    expect(document.body.textContent).toContain("2 Org headings projected from 1 source files");
    expect(document.body.textContent).toContain("丽水站");
    expect(document.body.textContent).not.toContain("No travel places");
  });

  it("renders a direct Org document without repeating the site hero", async () => {
    const selectedTheme = defineTheme({
      name: "isolated-route-theme",
      layouts: {
        page: ({ renderedHtml }) => ({
          html: `<article class="isolated-route-layout">${renderedHtml ?? ""}</article>`,
        }),
      },
    });
    await mountStaticRouter("/wallpaper-gallery", fetchStaticFixture(), "", selectedTheme);

    await waitForText("Static rendered body");
    expect(window.location.pathname).toBe("/wallpaper-gallery");
    expect(document.querySelector(".site-header")).toBeTruthy();
    expect(document.querySelector(".site-hero")).toBeNull();
    expect(document.querySelector(".isolated-route-layout")).toBeTruthy();
    expect(document.body.textContent).toContain("Static Gallery");
  });

  it("keeps Zen reading chrome-free and handles keyboard article navigation", async () => {
    const fetch = fetchBlogStaticFixture();
    await mountStaticRouter("/blogs", fetch);

    await waitForText("First Article");
    await act(async () => {
      document.querySelector<HTMLButtonElement>('button[data-blog-article="101"]')?.click();
    });

    await waitForText("First body");
    expect(window.location.pathname).toBe("/blogs/101");
    expect(appView()).toBe("blog");
    expect(appReaderMode()).toBe("zen");
    expect(document.querySelector(".site-header")).toBeNull();
    expect(document.querySelector(".site-hero")).toBeNull();
    expect(document.querySelector(".runtime-state")).toBeNull();
    expect(
      fetch.mock.calls.some(([input]) => String(input).includes("org-zhixing.gallery.json")),
    ).toBe(false);

    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }));
    });
    await waitForText("Second body");
    expect(window.location.pathname).toBe("/blogs/202");
    expect(appReaderMode()).toBe("zen");

    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
    });
    await waitForText("First Article");
    expect(window.location.pathname).toBe("/blogs");
    expect(appReaderMode()).toBe("library");
    expect(document.querySelector(".site-header")).toBeTruthy();
    expect(document.body.textContent).not.toContain("Second body");
  });

  it("starts Gallery, shell manifest, and config requests without serial blocking", async () => {
    const requested: string[] = [];
    let resolveConfig!: (response: Response) => void;
    let resolveManifest!: (response: Response) => void;
    let resolveGallery!: (response: Response) => void;
    const configResponse = new Promise<Response>((resolve) => (resolveConfig = resolve));
    const manifestResponse = new Promise<Response>((resolve) => (resolveManifest = resolve));
    const galleryResponse = new Promise<Response>((resolve) => (resolveGallery = resolve));
    const fetch = vi.fn((input: RequestInfo | URL): Promise<Response> => {
      const url = input instanceof URL ? input : new URL(String(input), window.location.href);
      requested.push(url.pathname);
      if (url.pathname.endsWith("/org-zhixing.toml")) return configResponse;
      if (url.pathname.endsWith("/org-zhixing.static.json")) return manifestResponse;
      if (url.pathname.endsWith("/org-zhixing.gallery.json")) return galleryResponse;
      return Promise.resolve(new Response("not found", { status: 404 }));
    });

    const mounting = mountStaticRouter("/gallery", fetch);
    await vi.waitFor(() => {
      expect(requested).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/org-zhixing\.toml$/),
          expect.stringMatching(/org-zhixing\.static\.json$/),
          expect.stringMatching(/org-zhixing\.gallery\.json$/),
        ]),
      );
    });
    resolveConfig(textResponse(configText));
    resolveManifest(jsonResponse(staticSiteFixture()));
    resolveGallery(jsonResponse(staticGalleryFixture()));
    await mounting;
    await waitForText("2 image items");
  });

  it("replaces the static initial shell without hydration or console errors", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    await mountStaticRouter(
      "/blogs",
      fetchBlogStaticFixture(),
      '<div data-initial-app-shell role="status">Loading Zhixing</div>',
    );

    await waitForText("First Article");
    expect(document.querySelector("[data-initial-app-shell]")).toBeNull();
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("opens accessible Mobile navigation and closes it after route selection", async () => {
    await mountStaticRouter("/gallery");
    await waitForText("2 image items");

    const trigger = document.querySelector<HTMLButtonElement>('[aria-label="Open navigation"]');
    expect(trigger).toBeTruthy();
    expect(trigger?.getBoundingClientRect).toBeTypeOf("function");
    expect(trigger?.getAttribute("aria-expanded")).toBe("false");
    await act(async () => {
      trigger?.click();
      await new Promise((resolve) => window.setTimeout(resolve, 50));
    });
    expect(document.querySelector('[role="dialog"]')).toBeTruthy();
    expect(trigger?.getAttribute("aria-expanded")).toBe("true");
    expect(document.body.textContent).toContain("Choose a view from the life archive.");
    const notes = document.querySelector<HTMLAnchorElement>('.mobile-nav-list a[href="/notes"]');
    expect(notes).toBeTruthy();
    await act(async () => {
      notes?.click();
      await new Promise((resolve) => window.setTimeout(resolve, 50));
    });

    expect(document.body.textContent).toContain("2 indexed notes from 2 Org sources");
    expect(window.location.pathname).toBe("/notes");
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(trigger?.getAttribute("aria-expanded")).toBe("false");
  });

  it("handles static agenda program and inspector clicks through router search", async () => {
    await mountStaticRouter("/agenda");

    await waitForText("Classic");
    expect(window.location.pathname).toBe("/agenda");
    expect(window.location.search).toBe("");

    await act(async () => {
      document.querySelector<HTMLButtonElement>('button[data-agenda-mode="auto"]')?.click();
    });
    await waitForText("Auto Grouping");
    expect(window.location.pathname).toBe("/agenda");
    expect(window.location.search).toContain("agenda=auto");
    expect(document.querySelector('button[data-agenda-mode="auto"]')?.className).toContain(
      "active",
    );

    await act(async () => {
      document.querySelector<HTMLElement>("[data-agenda-rule-select]")?.click();
    });
    expect(window.location.search).toContain("rule=");

    await act(async () => {
      document.querySelector<HTMLButtonElement>('button[data-agenda-panel="selectors"]')?.click();
    });
    await waitForText("Super-agenda selector coverage");
    expect(window.location.search).toContain("panel=selectors");
    expect(
      document
        .querySelector<HTMLButtonElement>('button[data-agenda-panel="selectors"]')
        ?.getAttribute("aria-selected"),
    ).toBe("true");
  });

  const mountStaticRouter = async (
    path = "/gallery",
    fetch = fetchStaticFixture(),
    initialHtml = "",
    selectedTheme?: ZhixingTheme,
  ): Promise<ReturnType<typeof createOrgZhixingRouter>> => {
    window.history.replaceState(null, "", path);
    vi.stubGlobal("fetch", fetch);
    const rootNode = document.createElement("div");
    rootNode.id = "app";
    rootNode.innerHTML = initialHtml;
    document.body.append(rootNode);
    const runtimeTheme =
      selectedTheme ??
      defineTheme({
        name: "router-test-theme",
        layouts: {},
      });
    const router = createOrgZhixingRouter({
      getQueryClient: testQueryClientFactory(),
      selectedTheme: runtimeTheme,
    });
    const runtime: ThemeRuntime = {
      isolationId: "router-test",
      selection: {
        id: runtimeTheme.name,
        package: null,
        defaultVariant: "default",
        variants: ["default"],
        transport: { kind: "workspace", module: "router-test-theme" },
      },
      selectedTheme: runtimeTheme,
      registry: createThemeRegistry([runtimeTheme]),
    };
    await act(async () => {
      mountedRoot = createRoot(rootNode);
      mountedRoot.render(
        <ThemeRuntimeProvider runtime={runtime}>
          <RouterProvider router={router} />
        </ThemeRuntimeProvider>,
      );
    });
    return router;
  };
});

const navigateTo = async (
  router: ReturnType<typeof createOrgZhixingRouter>,
  to: "/blogs" | "/gallery" | "/notes" | "/travel",
): Promise<void> => {
  await act(async () => {
    await router.navigate({ to });
  });
};

const testQueryClientFactory = (): (() => Promise<import("@tanstack/react-query").QueryClient>) => {
  const queryClient = import("@tanstack/react-query").then(
    ({ QueryClient: TanStackQueryClient }) =>
      new TanStackQueryClient({
        defaultOptions: {
          queries: {
            gcTime: Infinity,
            retry: false,
            staleTime: Infinity,
          },
        },
      }),
  );
  return () => queryClient;
};

const fetchStaticFixture = () => {
  const staticSite = staticSiteFixture();
  const gallery = staticGalleryFixture();
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = input instanceof URL ? input : new URL(String(input), window.location.href);
    if (url.pathname.endsWith("/org-zhixing.toml")) {
      return textResponse(configText);
    }
    if (url.pathname.endsWith("/org-zhixing.static.json")) {
      return jsonResponse(staticSite);
    }
    if (url.pathname.endsWith("/org-zhixing.gallery.json")) {
      return jsonResponse(gallery);
    }
    return new Response("not found", { status: 404 });
  });
};

const fetchBlogStaticFixture = () => {
  const sources = [blogProjection()];
  const staticSite = {
    ...staticSiteBase(),
    blog: blogIndexFixture(sources),
    sources,
  };
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = input instanceof URL ? input : new URL(String(input), window.location.href);
    if (url.pathname.endsWith("/org-zhixing.toml")) {
      return textResponse(configText);
    }
    if (url.pathname.endsWith("/org-zhixing.static.json")) {
      return jsonResponse(staticSite);
    }
    return new Response("not found", { status: 404 });
  });
};

const staticSiteFixture = (): StaticSiteData => ({
  ...staticSiteBase(),
  attachmentGallery: staticGallerySummary(),
  sources: [staticProjection(), demoProjection(), travelProjection()],
});

const staticGalleryFixture = (): StaticGalleryData => ({
  schemaVersion: 1,
  ...attachmentGalleryFromSources([staticProjection(), demoProjection(), travelProjection()]),
});

const staticGallerySummary = (): StaticGallerySummary => ({
  shardPath: "org-zhixing.gallery.json",
  recordCount: 2,
  entryCount: 3,
  sourceCount: 3,
  label: "3 Org sources",
  siteWide: true,
  firstThumbnailPath: null,
});

const staticSiteBase = (): Omit<StaticSiteData, "sources"> => ({
  schemaVersion: 1,
  generatedAt: "2026-05-20T00:00:00.000Z",
  configPath: "org-zhixing.toml",
  orgize: { buildTime: "test", gitHash: "test" },
});

const travelProjection = (): StaticSourceProjection => {
  const projection = structuredClone(staticProjection());
  const source = sourceRange(900);
  projection.id = "travel";
  projection.name = "Travel Demo";
  projection.file = "travel.org";
  projection.sourceFile = "blog/travel.org";
  projection.sourceBytes = 256;
  projection.html = "<main><h1>Travel Demo</h1></main>";
  projection.viewIndex.records = [];
  projection.sectionIndex!.records = [
    sectionRecord({
      effectiveTags: ["travel"],
      level: 1,
      outlinePathText: ["游山玩水->浙江"],
      rangeStart: 900,
      title: "游山玩水->浙江",
    }),
    sectionRecord({
      body: [{ source, text: "丽水站" }],
      level: 2,
      outlinePathText: ["游山玩水->浙江", "丽水站"],
      properties: [
        { key: "GEO_LAT", source, value: "28.4455222" },
        { key: "GEO_LON", source, value: "119.9504194" },
      ],
      rangeStart: 920,
      title: "丽水站",
    }),
  ];
  projection.attachmentInventory!.entries = [];
  projection.attachmentInventory!.display = [];
  projection.agendaView!.cards = [];
  projection.agendaView!.totalCandidates = 0;
  projection.memory!.stats.totalRecords = 0;
  projection.memory!.stats.currentRecords = 0;
  projection.memory!.records = [];
  return projection;
};

const demoProjection = (): StaticSourceProjection => {
  const projection = structuredClone(staticProjection());
  projection.id = "demo";
  projection.name = "Demo Source";
  projection.file = "org-zhixing-demo.org";
  projection.sourceFile = "blog/org-zhixing-demo.org";
  projection.html = "<main><h1>Demo Source</h1><p>Demo rendered body</p></main>";
  projection.viewIndex.records[0].title = "Demo Source";
  projection.sectionIndex!.records[0].title = "Demo Source";
  projection.sectionIndex!.records[0].titleText = "Demo Source";
  projection.sectionIndex!.records[0].outlinePath = ["Demo Source"];
  projection.sectionIndex!.records[0].outlinePathText = ["Demo Source"];
  projection.attachmentInventory!.entries[0].sectionTitle = "Demo Source";
  projection.attachmentInventory!.display[0].sectionTitle = "Demo Source";
  projection.attachmentInventory!.display[0].sectionTitleText = "Demo Source";
  projection.memory!.records[0].title = "Demo Source";
  return projection;
};

const blogProjection = (): StaticSourceProjection => {
  const projection = structuredClone(staticProjection());
  projection.id = "blog-demo";
  projection.name = "Blog Demo";
  projection.file = "blog-demo.org";
  projection.sourceFile = "blog/blog-demo.org";
  projection.sourceBytes = 512;
  projection.html = `
    <main>
      <h1>First Article</h1>
      <p>First body</p>
      <h1>Second Article</h1>
      <p>Second body</p>
    </main>
  `;
  projection.viewIndex.records = [
    record({
      effectiveTags: ["blog", "writing"],
      properties: [{ key: "DATE", value: "<2026-05-17 Sun>" }],
      rangeStart: 101,
      title: "First Article",
    }),
    record({
      effectiveTags: ["blog", "writing"],
      properties: [{ key: "DATE", value: "<2026-05-16 Sat>" }],
      rangeStart: 202,
      title: "Second Article",
    }),
  ];
  projection.sectionIndex!.records = [
    sectionRecord({
      effectiveTags: ["blog", "writing"],
      level: 1,
      outlinePathText: ["First Article"],
      rangeStart: 101,
      title: "First Article",
    }),
    sectionRecord({
      effectiveTags: ["blog", "writing"],
      level: 1,
      outlinePathText: ["Second Article"],
      rangeStart: 202,
      title: "Second Article",
    }),
  ];
  projection.attachmentInventory!.entries = [];
  projection.attachmentInventory!.display = [];
  projection.agendaView!.cards = [];
  projection.agendaView!.totalCandidates = 0;
  projection.memory!.stats.totalRecords = 0;
  projection.memory!.stats.currentRecords = 0;
  projection.memory!.records = [];
  return projection;
};

const blogIndexFixture = (sources: StaticSourceProjection[]): StaticSiteData["blog"] => {
  const articles = sources.flatMap((source) =>
    source.viewIndex.records.map((article) => ({
      ...article,
      file: source.file,
      sourceFile: source.sourceFile,
      sourceId: source.id,
      sourceName: source.name,
    })),
  );
  return {
    articleCount: articles.length,
    articles,
    dateRange: { start: "<2026-05-16 Sat>", end: "<2026-05-17 Sun>" },
    siteWide: true,
    sourceCount: sources.length,
    tagFacets: [{ count: articles.length, tag: "writing" }],
  };
};

const appView = (): string | undefined =>
  document.querySelector("#app")?.getAttribute("data-view") ?? undefined;

const appReaderMode = (): string | undefined =>
  document.querySelector("#app")?.getAttribute("data-reader-mode") ?? undefined;

const waitForText = async (text: string): Promise<void> => {
  const deadline = Date.now() + 4_000;
  while (!document.body.textContent?.includes(text)) {
    if (Date.now() >= deadline) {
      expect(document.body.textContent).toContain(text);
    }
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
  }
};

const textResponse = (body: string): Response =>
  new Response(body, { headers: { "content-type": "text/plain" } });

const jsonResponse = (body: unknown): Response =>
  new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
  });
