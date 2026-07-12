import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { performance } from "node:perf_hooks";
import { describe, expect, it } from "vitest";
import { renderView } from "../src/render";
import type { StaticSiteData, StaticSourceProjection } from "../src/staticSiteData";
import { travelViewFromStaticSite } from "../src/travelSiteProjection";
import { createTravelViewFromSources } from "../src/travelModel";
import { sectionRecord } from "./modelFixtures";
import { staticProjection } from "./staticProjection.fixture";

describe("Org Zhixing performance regression gates", () => {
  it("keeps real Travel scale on the plain static render path", () => {
    const travelView = createTravelViewFromSources([
      {
        records: travelRecords(22),
        sourceFile: "blog/travel.org",
        sourceName: "Travel",
      },
    ]);

    const result = sample("renderTravel22", () =>
      renderView({ view: "travel", document: null, travelView }),
    );

    expect(result.lastValue).toContain("22 Org headings projected from 1 source files");
    expect(result.lastValue).toContain("data-travel-card");
    expect(result.lastValue).not.toContain("data-travel-virtual-list");
    expect(result.p95Ms).toBeLessThan(30);
  });

  it("caches source-derived static Travel projections when manifest travel is absent", () => {
    const staticSite = staticSiteWithTravelRecords({ sources: 8, recordsPerSource: 100 });
    const first = travelViewFromStaticSite(staticSite);
    const second = travelViewFromStaticSite(staticSite);
    const cached = sample("cachedTravelProjection", () => travelViewFromStaticSite(staticSite), 50);

    expect(first.places).toHaveLength(800);
    expect(second).toBe(first);
    expect(cached.lastValue).toBe(first);
    expect(cached.p95Ms).toBeLessThan(2);
  });

  it("keeps heavy Travel virtualization behind an explicit lazy boundary", () => {
    const router = readFileSync("src/react/router.tsx", "utf8");
    const travelRender = readFileSync("src/travelRender.ts", "utf8");

    expect(router).not.toMatch(/import\s+\{?\s*bindTravelVirtualList/);
    expect(router).toContain('import("../travelVirtualList")');
    expect(router).toContain('html.includes("data-travel-virtual-list")');
    expect(travelRender).toContain("const virtualListThreshold = 80;");
    expect(travelRender).toContain("travel.places.length >= virtualListThreshold");
  });

  it("keeps heavy Blog indexing behind an explicit lazy boundary", () => {
    const router = readFileSync("src/react/router.tsx", "utf8");
    const blogRender = readFileSync("src/blogRender.ts", "utf8");
    const perfScript = readFileSync("scripts/bench-org-zhixing-ui.mjs", "utf8");

    expect(router).not.toMatch(/import\s+\{?\s*bindBlogVirtualList/);
    expect(router).toContain('import("../blogVirtualList")');
    expect(router).toContain('html.includes("data-blog-virtual-list")');
    expect(blogRender).toContain("export const blogVirtualListThreshold = 120;");
    expect(blogRender).toContain("articles.length >= blogVirtualListThreshold");
    expect(perfScript).toContain("eagerBlogVirtualList: false");
    expect(perfScript).toContain("dynamicBlogVirtualListChunk");
  });

  it("keeps parser runtime and source shards off static site-wide startup", () => {
    const router = readFileSync("src/react/router.tsx", "utf8");
    const contentServices = readFileSync("src/services/contentServices.ts", "utf8");
    const orgizeClient = readFileSync("src/orgizeClient.ts", "utf8");
    const perfScript = readFileSync("scripts/bench-org-zhixing-ui.mjs", "utf8");
    const staticSiteData = readFileSync("src/staticSiteData.ts", "utf8");
    const galleryPage = readFileSync("src/react/GalleryPage.tsx", "utf8");
    const appViewRender = readFileSync("src/appViewRender.ts", "utf8");

    expect(orgizeClient).not.toContain("this.#worker = options.createWorker();");
    expect(orgizeClient).toContain("#workerForRequest()");
    expect(router).toContain("shell.staticSite?.blog");
    expect(router).toContain("loadGalleryQuery(context)");
    expect(galleryPage).toContain("galleryRoute.useLoaderData()");
    expect(router).toContain('webpackChunkName: "route-gallery"');
    expect(router).toContain('"./GalleryPage"');
    expect(staticSiteData).toContain("loadStaticGalleryData");
    expect(staticSiteData).toContain('publicAssetUrl("org-zhixing.gallery.json")');
    expect(router).not.toContain("shell.staticSite?.attachmentGallery");
    expect(router).not.toContain("attachmentGalleryRender");
    expect(router).not.toContain("attachmentGalleryViewer");
    expect(appViewRender).not.toContain("attachmentGalleryRender");
    expect(galleryPage).toContain(
      'import { renderAttachmentGallery } from "../attachmentGalleryRender"',
    );
    expect(galleryPage).toContain('import("../attachmentGalleryViewer")');
    expect(router).toContain("travelViewFromStaticSite(shell.staticSite)");
    expect(router).toContain("scheduleTravelGlanceRuntimePrefetch");
    expect(router).toContain("scheduleTravelIdleTask");
    expect(contentServices).toContain("loadStaticSourceFor(shell.staticSite, source)");
    expect(contentServices).toContain("loadAllStaticSources(shell.staticSite");
    expect(perfScript).toContain("lazyParserWorker: true");
    expect(perfScript).toContain("staticSiteWideSourceDeferral: true");
    expect(perfScript).toContain("idleInteractionChunkPrefetch: true");
  });

  it("keeps static agenda, attachments, Agent memory, and section indexes behind dedicated lazy shards", () => {
    const generator = readFileSync("scripts/generate-static-site.mjs", "utf8");
    const perfScript = readFileSync("scripts/bench-org-zhixing-ui.mjs", "utf8");
    const rsbuildConfig = readFileSync("rsbuild.config.ts", "utf8");
    const staticSiteData = readFileSync("src/staticSiteData.ts", "utf8");
    const staticSiteShards = readFileSync("src/staticSiteShards.ts", "utf8");
    const contentServices = readFileSync("src/services/contentServices.ts", "utf8");

    expect(staticSiteShards).toContain('import("@tanstack/query-core")');
    expect(staticSiteShards).not.toContain('from "@tanstack/query-core"');
    expect(staticSiteShards).not.toContain("effect/Effect");
    expect(generator).toContain('from "effect/Effect"');
    expect(generator).toContain("StaticGenerationError");
    expect(generator).toContain('const sourceMemoryShardPublicDir = "org-zhixing.memory";');
    expect(generator).toContain('const sourceSectionShardPublicDir = "org-zhixing.sections";');
    expect(generator).toContain(
      'const sourceAttachmentShardPublicDir = "org-zhixing.attachments";',
    );
    expect(generator).toContain('const sourceAgendaShardPublicDir = "org-zhixing.agenda";');
    expect(generator).toContain("sourceProjectionShard(source)");
    expect(generator).toContain(
      "const { agendaRange, agendaView, attachmentInventory, memory, sectionIndex, ...projection } =",
    );
    expect(generator).toContain("agendaShardPath: sourceAgendaShardPublicPath(source)");
    expect(generator).toContain("attachmentShardPath: sourceAttachmentShardPublicPath(source)");
    expect(generator).toContain("memoryShardPath: sourceMemoryShardPublicPath(source)");
    expect(generator).toContain("sectionShardPath: sourceSectionShardPublicPath(source)");
    expect(staticSiteData).toContain("loadStaticAgendaForSource");
    expect(staticSiteData).toContain("loadStaticAttachmentInventoryForSource");
    expect(staticSiteData).toContain("loadStaticMemoryForSource");
    expect(staticSiteData).toContain("loadStaticSectionIndexForSource");
    expect(staticSiteData).toContain("loadCachedStaticAgendaShard");
    expect(staticSiteData).toContain("loadCachedStaticAttachmentShard");
    expect(staticSiteData).toContain("loadCachedStaticMemoryShard");
    expect(staticSiteData).toContain("loadCachedStaticSectionShard");
    expect(staticSiteShards).toContain("fetchStaticAgendaShard");
    expect(staticSiteShards).toContain("fetchStaticAttachmentShard");
    expect(staticSiteShards).toContain("fetchStaticMemoryShard");
    expect(staticSiteShards).toContain("fetchStaticSectionShard");
    expect(staticSiteData).toContain("Promise.all([");
    expect(contentServices).toContain("loadStaticAgendaForSource(shell.staticSite, staticSource)");
    expect(contentServices).toContain("loadStaticAttachmentInventoryForSource(");
    expect(contentServices).toContain("loadStaticMemoryForSource(shell.staticSite, staticSource)");
    expect(contentServices).toContain("loadStaticSectionIndexForSource(");
    expect(rsbuildConfig).toContain("pluginReact()");
    expect(rsbuildConfig).toContain("staticAgendaShardRoot");
    expect(rsbuildConfig).toContain("staticAttachmentShardRoot");
    expect(rsbuildConfig).toContain("staticMemoryShardRoot");
    expect(rsbuildConfig).toContain("staticSectionShardRoot");
    expect(rsbuildConfig).toContain("org-zhixing.agenda/[name][ext]");
    expect(rsbuildConfig).toContain("org-zhixing.attachments/[name][ext]");
    expect(rsbuildConfig).toContain("org-zhixing.memory/[name][ext]");
    expect(rsbuildConfig).toContain("org-zhixing.sections/[name][ext]");
    expect(perfScript).toContain("agendaShardBytes");
    expect(perfScript).toContain("attachmentShardBytes");
    expect(perfScript).toContain("eagerTanStackQueryCore: false");
    expect(perfScript).toContain("dynamicTanStackQueryChunk");
    expect(perfScript).toContain("eagerEffectRuntime: false");
    expect(perfScript).toContain("generatedTailwindCssBytes");
    expect(perfScript).toContain("tailwindContentUtilityLeak: false");
    expect(perfScript).toContain("memoryShardBytes");
    expect(perfScript).toContain("sectionShardBytes");
    expect(perfScript).toContain("static-agenda-shards");
    expect(perfScript).toContain("static-attachment-shards");
    expect(perfScript).toContain("static-memory-shards");
    expect(perfScript).toContain("static-section-shards");
  });

  it("anchors the app shell in Rsbuild, React, and TanStack Router without eager React Query", () => {
    const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
      scripts: Record<string, string>;
    };
    const main = readFileSync("src/main.tsx", "utf8");
    const router = readFileSync("src/react/router.tsx", "utf8");
    const queryClient = readFileSync("src/react/queryClient.ts", "utf8");
    const contentServices = readFileSync("src/services/contentServices.ts", "utf8");
    const rsbuildConfig = readFileSync("rsbuild.config.ts", "utf8");
    const perfScript = readFileSync("scripts/bench-org-zhixing-ui.mjs", "utf8");
    const pagesWorkflow = readFileSync(".github/workflows/ci.yml", "utf8");
    const publicConfig = readFileSync("public/org-zhixing.toml", "utf8");

    expect(packageJson.scripts.dev).toContain("rsbuild dev");
    expect(packageJson.scripts.build).toContain("rsbuild build");
    expect(packageJson.scripts.preview).toContain("rsbuild preview");
    expect(packageJson.devDependencies["@rsbuild/core"]).toBeTruthy();
    expect(packageJson.devDependencies["@rsbuild/plugin-react"]).toBeTruthy();
    expect(packageJson.dependencies.react).toBeTruthy();
    expect(packageJson.dependencies["react-dom"]).toBeTruthy();
    expect(packageJson.dependencies["@tanstack/react-router"]).toBeTruthy();
    expect(packageJson.dependencies["@tanstack/react-query"]).toBeTruthy();
    expect(packageJson.dependencies["@tanstack/router-plugin"]).toBeUndefined();
    expect(packageJson.devDependencies["@tanstack/router-plugin"]).toBeUndefined();
    expect(packageJson.devDependencies["@rspack/core"]).toBeUndefined();
    expect(packageJson.devDependencies["@rspack/cli"]).toBeUndefined();
    expect(main).toContain("<RouterProvider router={router} />");
    expect(router).toContain("createRouter");
    expect(router).toContain("basepath: orgZhixingBasePath()");
    expect(router).toContain('path: "/blogs"');
    expect(router).toContain('path: "/blogs/$articleId"');
    expect(router).toContain('defaultPreload: "intent"');
    expect(router).toContain("loadArticleQuery");
    expect(router).toContain("loadNotesQuery");
    expect(router).not.toContain("Legacy");
    expect(router).not.toContain("?view=");
    expect(queryClient).toContain('import("@tanstack/react-query")');
    expect(queryClient).not.toContain('from "@tanstack/react-query"');
    expect(contentServices).toContain('from "effect/Effect"');
    expect(contentServices).toContain("loadBlogArticleData");
    expect(rsbuildConfig).toContain("defineConfig");
    expect(rsbuildConfig).toContain("pluginReact()");
    expect(rsbuildConfig).toContain("__ORG_ZHIXING_BASE_PATH__");
    expect(rsbuildConfig).toContain("deploymentBasePathFromConfig(publicConfigPath)");
    expect(rsbuildConfig).toContain(
      "process.env.ORG_ZHIXING_BASE_PATH ?? deploymentBasePathFromConfig(publicConfigPath)",
    );
    expect(rsbuildConfig).not.toContain("@tanstack/router-plugin");
    expect(pagesWorkflow).not.toContain("ORG_ZHIXING_BASE_PATH");
    expect(pagesWorkflow).toContain("actions/upload-pages-artifact@v5");
    expect(pagesWorkflow).toContain("actions/deploy-pages@v5");
    expect(publicConfig).toContain('base_url = "https://tao3k.github.io/org-zhixing-themes/"');
    expect(perfScript).toContain("distAssetPath");
    expect(perfScript).toContain("eagerReactQuery: false");
    expect(perfScript).toContain("dynamicReactQueryChunk");
  });

  it("does not render parser/source loading text in the static app shell", () => {
    const router = readFileSync("src/react/router.tsx", "utf8");
    const contentServices = readFileSync("src/services/contentServices.ts", "utf8");
    const render = readFileSync("src/render.ts", "utf8");

    expect(router).not.toContain("Loading Org parser");
    expect(router).not.toContain("Loading source");
    expect(contentServices).not.toContain("Loading Org parser");
    expect(contentServices).not.toContain("Loading source");
    expect(render).not.toContain("Loading Org parser");
  });

  it("keeps static Blog generation on one article per discovered Org file", () => {
    const generator = readFileSync("scripts/generate-static-site.mjs", "utf8");

    expect(generator).toContain("sources.map(blogArticleFromSource)");
    expect(generator).toContain("org.metadataJson()");
    expect(generator).toContain("const title = blogArticleTitle(source);");
    expect(generator).not.toContain("title: source.name");
    expect(generator).not.toContain("source.sectionIndex.records.map");
    expect(generator).not.toContain(
      'record.effectiveTags.some((tag) => tag.toLowerCase() === "blog")',
    );
  });

  it("projects Blog article display titles from Org #+TITLE metadata", () => {
    execFileSync("node", ["scripts/generate-static-site.mjs"], { stdio: "pipe" });
    const manifest = JSON.parse(
      readFileSync(".cache/org-zhixing/static-site.json", "utf8"),
    ) as StaticSiteData;
    const sourceTitles = new Map(
      manifest.sources.map((source) => [source.sourceFile, source.orgTitle ?? source.name]),
    );
    const travelArticle = manifest.blog?.articles.find(
      (article) => article.sourceFile === "blog/travel.org",
    );

    expect(manifest.blog?.articleCount).toBe(manifest.sources.length);
    for (const article of manifest.blog?.articles ?? []) {
      expect(article.title).toBe(sourceTitles.get(article.sourceFile));
      expect(article.sourceName).toBe(article.title);
    }
    expect(travelArticle?.title).toBe("游山玩水");
    expect(travelArticle?.sourceName).toBe("游山玩水");
    expect(manifest.blog?.articles.map((article) => article.title)).toContain("Org Syntax Atlas");
  });

  it("keeps Zen reader progress as a lazy reading affordance", () => {
    const router = readFileSync("src/react/router.tsx", "utf8");
    const blogZenProgress = readFileSync("src/blogZenProgress.ts", "utf8");

    expect(router).not.toMatch(/import\s+\{?\s*bindBlogZenProgress/);
    expect(router).toContain('import("../blogZenProgress")');
    expect(blogZenProgress).toContain('const progressSelector = "[data-blog-zen-progress]"');
    expect(blogZenProgress).toContain("readingProgressPercent");
    expect(blogZenProgress).not.toContain("@mozilla/readability");
  });

  it("keeps Travel Zen Glance window and masonry runtimes behind lazy boundaries", () => {
    const router = readFileSync("src/react/router.tsx", "utf8");
    const travelGlance = readFileSync("src/travelGlance.ts", "utf8");
    const perfScript = readFileSync("scripts/bench-org-zhixing-ui.mjs", "utf8");

    expect(router).toContain('import("../travelVirtualList")');
    expect(router).not.toContain("masonry-layout");
    expect(router).not.toContain("@zag-js/floating-panel");
    expect(travelGlance).not.toMatch(/import\s+\{?\s*machine/);
    expect(travelGlance).not.toContain("@zag-js/dialog");
    expect(travelGlance).toContain('import("@zag-js/floating-panel")');
    expect(travelGlance).not.toMatch(/import\s+Masonry/);
    expect(travelGlance).toContain('import("masonry-layout")');
    expect(travelGlance).toContain('itemSelector: ".travel-glance-flow-item"');
    expect(travelGlance).not.toContain('flow.dataset.layout = "single"');
    expect(perfScript).toContain("eagerFloatingPanel: false");
    expect(perfScript).toContain("dynamicFloatingPanelChunk");
  });

  it("keeps attachment lightbox code behind an image-opener lazy boundary", () => {
    const router = readFileSync("src/react/router.tsx", "utf8");
    const galleryPage = readFileSync("src/react/GalleryPage.tsx", "utf8");
    const routeShellWriter = readFileSync("src/node/routeShellWriter.mjs", "utf8");

    expect(router).not.toMatch(/import\s+\{?\s*bindAttachmentGalleryViewer/);
    expect(router).not.toContain("attachmentGalleryViewer");
    expect(galleryPage).toContain('import("../attachmentGalleryViewer")');
    expect(galleryPage).toContain('html.includes("data-attachment-open")');
    expect(routeShellWriter).toContain("renderAttachmentGallery(galleryData");
    expect(routeShellWriter).toContain("stripApplicationScripts");
    expect(routeShellWriter).toContain('activeView: "gallery"');
    expect(routeShellWriter).not.toContain("attachmentGalleryViewer");
  });

  it("keeps link soft wrapping free of the heavyweight CSS line-break runtime", () => {
    const typographicText = readFileSync("src/typographicText.ts", "utf8");

    expect(typographicText).not.toContain("css-line-break");
    expect(typographicText).toContain("Intl");
    expect(typographicText).toContain("<wbr>");
  });
});

type SampleResult<T> = {
  lastValue: T;
  name: string;
  p50Ms: number;
  p95Ms: number;
};

const sample = <T>(name: string, fn: () => T, iterations = 30): SampleResult<T> => {
  let lastValue = fn();
  const values: number[] = [];
  for (let index = 0; index < iterations; index += 1) {
    const startedAt = performance.now();
    lastValue = fn();
    values.push(performance.now() - startedAt);
  }
  values.sort((left, right) => left - right);
  return {
    lastValue,
    name,
    p50Ms: round(percentile(values, 0.5)),
    p95Ms: round(percentile(values, 0.95)),
  };
};

const staticSiteWithTravelRecords = ({
  sources,
  recordsPerSource,
}: {
  sources: number;
  recordsPerSource: number;
}): StaticSiteData => ({
  schemaVersion: 1,
  generatedAt: "2026-05-21T00:00:00.000Z",
  configPath: "org-zhixing.toml",
  orgize: { buildTime: "test", gitHash: "test" },
  sources: Array.from({ length: sources }, (_, index) =>
    staticSourceWithTravelRecords(index + 1, recordsPerSource),
  ),
});

const staticSourceWithTravelRecords = (
  sourceIndex: number,
  recordsPerSource: number,
): StaticSourceProjection => {
  const projection = structuredClone(staticProjection());
  projection.id = `travel-${sourceIndex}`;
  projection.name = `Travel ${sourceIndex}`;
  projection.file = `travel-${sourceIndex}.org`;
  projection.sourceFile = `blog/travel-${sourceIndex}.org`;
  projection.sectionIndex!.records = travelRecords(recordsPerSource, sourceIndex * 10_000);
  return projection;
};

const travelRecords = (count: number, offset = 0) =>
  Array.from({ length: count }, (_, index) =>
    sectionRecord({
      level: 2,
      outlinePathText: [`游山玩水->Region ${Math.floor(index / 10) + 1}`, `Place ${index + 1}`],
      rangeStart: offset + index + 1,
      title: `Place ${index + 1}`,
    }),
  );

const percentile = (values: number[], ratio: number): number => {
  if (values.length === 0) {
    return 0;
  }
  const index = Math.min(values.length - 1, Math.ceil(values.length * ratio) - 1);
  return values[index] ?? 0;
};

const round = (value: number): number => Math.round(value * 100) / 100;
