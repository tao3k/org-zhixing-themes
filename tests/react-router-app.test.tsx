import { RouterProvider } from "@tanstack/react-router";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { attachmentGalleryFromSources } from "../src/attachmentGalleryModel";
import { createOrgZhixingRouter } from "../src/react/router";
import type { StaticSiteData, StaticSourceProjection } from "../src/staticSiteData";
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

  it("keeps Zen reading chrome-free and handles keyboard article navigation", async () => {
    await mountStaticRouter("/blogs", fetchBlogStaticFixture());

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

  const mountStaticRouter = async (
    path = "/gallery",
    fetch = fetchStaticFixture(),
  ): Promise<ReturnType<typeof createOrgZhixingRouter>> => {
    window.history.replaceState(null, "", path);
    vi.stubGlobal("fetch", fetch);
    const rootNode = document.createElement("div");
    rootNode.id = "app";
    document.body.append(rootNode);
    const router = createOrgZhixingRouter({ getQueryClient: testQueryClientFactory() });
    await act(async () => {
      mountedRoot = createRoot(rootNode);
      mountedRoot.render(<RouterProvider router={router} />);
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
  attachmentGallery: attachmentGalleryFromSources([
    staticProjection(),
    demoProjection(),
    travelProjection(),
  ]),
  sources: [staticProjection(), demoProjection(), travelProjection()],
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
  await vi.waitFor(() => expect(document.body.textContent).toContain(text));
};

const textResponse = (body: string): Response =>
  new Response(body, { headers: { "content-type": "text/plain" } });

const jsonResponse = (body: unknown): Response =>
  new Response(JSON.stringify(body), { headers: { "content-type": "application/json" } });
