import { describe, expect, it } from "vitest";
import { sourcePlanningAgendaRange } from "../src/agendaRange";
import { createAgentMemoryView } from "../src/memoryModel";
import {
  createDocumentView,
  noteRecords,
  withAgendaView,
  withAgentMemory,
  withAttachmentInventory,
} from "../src/model";
import { renderView } from "../src/render";
import { documentViewFromStaticSource, staticSourceFor } from "../src/staticSiteData";
import { cacheKeyFor, memoryResponse, record, sectionRecord, sourceRange } from "./modelFixtures";
import { staticProjection } from "./staticProjection.fixture";

describe("Org source view projections", () => {
  it("uses semantic headings as Notes when a real attachment source has no :record: tags", () => {
    const document = createDocumentView([
      record({
        title: "Wallpaper Attachment Gallery",
        effectiveTags: ["ATTACH", "house"],
      }),
      record({
        rangeStart: 120,
        title: "Blog-only heading",
        effectiveTags: ["blog"],
      }),
    ]);

    expect(document.counts.records).toBe(1);
    expect(noteRecords(document).map((item) => item.title)).toEqual([
      "Wallpaper Attachment Gallery",
    ]);
    expect(renderView({ view: "records", document })).toContain("Wallpaper Attachment Gallery");
  });

  it("keeps explicit :record: and attachment-backed headings in Notes", () => {
    const document = createDocumentView([
      record({
        title: "Attachment-only heading",
        effectiveTags: ["ATTACH"],
      }),
      record({
        title: "Typed note",
        effectiveTags: ["record", "ATTACH"],
      }),
    ]);

    expect(document.counts.records).toBe(2);
    expect(noteRecords(document).map((item) => item.title)).toEqual([
      "Attachment-only heading",
      "Typed note",
    ]);
  });

  it("does not synthesize Agenda rows from source planning when WASM returns no rows", () => {
    const document = createDocumentView([
      record({
        title: "Bathroom Design",
        effectiveTags: ["ATTACH", "house"],
        planning: {
          scheduled: "<2020-12-19 Sat>-<2020-12-19 Sat>",
        },
      }),
    ]);
    const projected = withAgendaView(
      document,
      {
        schemaVersion: 1,
        totalCandidates: 0,
        sortStrategy: [],
        cards: [],
        skipped: [],
      },
      {
        start: { year: 2026, month: 5, day: 15 },
        days: 7,
        end: { year: 2026, month: 5, day: 21 },
        label: "2026-05-15 to 2026-05-21",
        limit: 32,
        mode: "classic",
      },
    );

    const html = renderView({ view: "agenda", document: projected });

    expect(projected.counts.agenda).toBe(0);
    expect(html).toContain("No WASM agenda rows in 2026-05-15 to 2026-05-21.");
    expect(html).not.toContain("Bathroom Design");
    expect(html).not.toContain("&lt;2020-12-19 Sat&gt;-&lt;2020-12-19 Sat&gt;");
    expect(html).not.toContain("source planning");
  });

  it("derives a source-local range for a second WASM Agenda query", () => {
    const document = createDocumentView([
      record({
        title: "Bathroom Design",
        planning: {
          scheduled: "<2020-12-19 Sat>-<2020-12-19 Sat>",
        },
      }),
      record({
        rangeStart: 9,
        title: "Closed archive",
        planning: {
          closed: "[2019-07-27 Sat 16:32]",
        },
      }),
    ]);

    const range = sourcePlanningAgendaRange(document.agenda, {
      start: { year: 2026, month: 5, day: 15 },
      days: 7,
      end: { year: 2026, month: 5, day: 21 },
      label: "2026-05-15 - 2026-05-21",
      limit: 32,
      mode: "classic",
    });

    expect(range).toMatchObject({
      start: { year: 2019, month: 7, day: 27 },
      end: { year: 2020, month: 12, day: 19 },
      label: "2019-07-27 - 2020-12-19",
      mode: "classic",
    });
  });

  it("renders Notes through the shared Org HTML record renderer", () => {
    const document = createDocumentView(
      [
        record({
          bodyPreview: "Plain preview should not be primary",
          effectiveTags: ["record"],
          outline: "Environments / [[https://example.com/wallpaper][Wallpaper]]",
          rangeStart: 42,
          title: "[[https://example.com/wallpaper][Wallpaper]]",
        }),
      ],
      null,
      [
        sectionRecord({
          outlinePath: ["Environments", "[[https://example.com/wallpaper][Wallpaper]]"],
          outlinePathText: ["Environments", "Wallpaper"],
          rangeStart: 42,
          title: "[[https://example.com/wallpaper][Wallpaper]]",
        }),
      ],
    );

    const html = renderView({
      view: "records",
      document,
      articleHtml: `
        <main>
          <h2>Wallpaper</h2>
          <p>Rendered paragraph with <a href="https://example.com">a link</a>.</p>
          <pre><code>#+BEGIN_SRC rust</code></pre>
        </main>
      `,
    });

    expect(html).toContain("org-record-render");
    expect(html).toContain("1 explicit :record: heading from Org source");
    expect(html).toContain("Environments / Wallpaper");
    expect(html).toContain("Rendered paragraph");
    expect(html).toContain("<pre>");
    expect(html).not.toContain("[[https://example.com/wallpaper");
    expect(html).not.toContain("Plain preview should not be primary");
  });

  it("keeps source metadata out of Notes cards when the exporter omits Org keyword lines", () => {
    const source = sourceRange(99);
    const document = createDocumentView(
      [
        record({
          bodyPreview: "Plain preview should not be primary",
          effectiveTags: ["record"],
          rangeStart: 99,
          title: "Semantic source title",
        }),
      ],
      null,
      [
        sectionRecord({
          body: [
            {
              source,
              text: [
                "#+DOWNLOADED: https://example.com/original.jpg",
                "[[attachment:local-copy.jpg]]",
              ].join("\n"),
            },
          ],
          rangeStart: 99,
          title: "Semantic source title",
        }),
      ],
    );

    const html = renderView({
      view: "records",
      document,
      articleHtml: `
        <main>
          <h2>Exporter visible title</h2>
          <p><img src="attachment:local-copy.jpg"></p>
        </main>
      `,
    });

    expect(html).toContain("org-record-render");
    expect(html).toContain("local-copy.jpg");
    expect(html).not.toContain("Source metadata");
    expect(html).not.toContain("Downloaded");
    expect(html).not.toContain("https://example.com/original.jpg");
    expect(html).not.toContain("#+DOWNLOADED");
    expect(html).not.toContain("Plain preview should not be primary");
  });

  it("surfaces a missing HTML projection instead of rendering raw source content", () => {
    const source = sourceRange(123);
    const document = createDocumentView(
      [
        record({
          bodyPreview: "Plain preview should not be primary",
          effectiveTags: ["record"],
          rangeStart: 123,
          title: "Source-only note",
        }),
      ],
      null,
      [
        sectionRecord({
          body: [{ source, text: "Source-only body from semantic section." }],
          rangeStart: 123,
          title: "Source-only note",
        }),
      ],
    );

    const html = renderView({
      view: "records",
      document,
      articleHtml: "<main><h2>Different note</h2></main>",
    });

    expect(html).toContain("org-record-render--missing");
    expect(html).toContain("HTML projection missing for this Org section.");
    expect(html).not.toContain("Source-only body from semantic section.");
    expect(html).not.toContain("Plain preview should not be primary");
  });

  it("renders Memory records through the same Org HTML record renderer", () => {
    const source = sourceRange(84);
    const rawTitle = "[[https://example.com/memory][Memory heading]]";
    const document = withAgentMemory(
      createDocumentView(
        [
          record({
            bodyPreview: "Plain memory preview",
            effectiveTags: ["memory"],
            rangeStart: 84,
            title: rawTitle,
          }),
        ],
        null,
        [
          sectionRecord({
            outlinePath: ["Workspace", rawTitle],
            outlinePathText: ["Workspace", "Memory heading"],
            rangeStart: 84,
            title: rawTitle,
          }),
        ],
      ),
      createAgentMemoryView(
        memoryResponse({
          source,
          title: rawTitle,
          cards: [
            {
              source,
              decision: {
                code: "MEM-R001",
                kind: "current",
                severity: "info",
                title: "Render as semantic HTML",
                nextAction: "Keep unified projection in use.",
              },
              authority: [],
              title: rawTitle,
              todo: null,
              todoState: null,
              tags: ["memory"],
              effectiveTags: ["memory"],
              anchor: null,
              evidence: [],
              links: [],
            },
          ],
        }),
      ),
    );

    const html = renderView({
      view: "memory",
      document,
      articleHtml: `
        <main>
          <h2>Memory heading</h2>
          <p>Rendered memory paragraph with <code>inline code</code>.</p>
        </main>
      `,
    });

    expect(html).toContain("org-record-render--memory");
    expect(html).toContain("Rendered memory paragraph");
    expect(html).toContain("Memory heading");
    expect(html).not.toContain("[[https://example.com/memory");
    expect(html).not.toContain("Plain memory preview");
  });

  it("does not render raw Org content when a Memory section is missing from HTML", () => {
    const source = sourceRange(88);
    const document = withAgentMemory(
      createDocumentView(
        [
          record({
            bodyPreview: "Raw memory preview",
            effectiveTags: ["memory"],
            rangeStart: 88,
            title: "Missing Memory HTML",
          }),
        ],
        null,
        [
          sectionRecord({
            body: [
              {
                source,
                text: [
                  "#+DOWNLOADED: https://example.com/raw.jpg",
                  "[[https://example.com/raw][raw link]]",
                  "[[attachment:raw.jpg]]",
                ].join("\n"),
              },
            ],
            rangeStart: 88,
            title: "Missing Memory HTML",
          }),
        ],
      ),
      createAgentMemoryView(memoryResponse({ source, title: "Missing Memory HTML" })),
    );

    const html = renderView({
      view: "memory",
      document,
      articleHtml: "<main><h2>Different memory heading</h2></main>",
    });

    expect(html).toContain("org-record-render--missing");
    expect(html).not.toContain("#+DOWNLOADED");
    expect(html).not.toContain("[[https://example.com/raw");
    expect(html).not.toContain("[[attachment:raw.jpg]]");
    expect(html).not.toContain("Raw memory preview");
  });

  it("separates cache keys by source and late projection state", () => {
    const baseDocument = createDocumentView([record({ rangeStart: 7, title: "Cached note" })]);
    const attachmentDocument = withAttachmentInventory(baseDocument, {
      schemaVersion: 1,
      entries: [
        {
          source: sourceRange(7),
          sectionTitle: "Cached note",
          kind: { label: "link", link: { path: "image.jpg" } },
          path: "image.jpg",
          absolutePath: "/tmp/image.jpg",
          exists: true,
          vcs: {
            status: "notChecked",
            annex: { status: "notChecked" },
          },
        },
      ],
      display: [
        {
          source: sourceRange(7),
          sectionTitle: "Cached note",
          sectionTitleText: "Cached note",
          outlinePath: ["Cached note"],
          outlinePathText: ["Cached note"],
          tags: [],
          effectiveTags: [],
          directoryPath: ".attach/id",
          linkPath: "image.jpg",
          absolutePath: "/tmp/image.jpg",
          exists: true,
          mediaKind: "image",
        },
      ],
      syncPlan: { actions: [] },
      archiveAdvice: [],
      warnings: [],
    });

    const pendingKey = cacheKeyFor(baseDocument, "records", "org-zhixing-demo.org", "");
    const renderedKey = cacheKeyFor(
      baseDocument,
      "records",
      "org-zhixing-demo.org",
      "<main></main>",
    );
    const attachmentKey = cacheKeyFor(
      attachmentDocument,
      "records",
      "org-zhixing-demo.org",
      "<main></main>",
    );
    const otherSourceKey = cacheKeyFor(
      attachmentDocument,
      "records",
      "wallpaper-gallery.org",
      "<main></main>",
    );

    expect(new Set([pendingKey, renderedKey, attachmentKey, otherSourceKey]).size).toBe(4);
  });

  it("hydrates a complete document view from the production static projection", () => {
    const staticSource = staticProjection();
    const matched = staticSourceFor(
      {
        schemaVersion: 1,
        generatedAt: "2026-05-20T00:00:00.000Z",
        configPath: "org-zhixing.toml",
        orgize: { buildTime: "test", gitHash: "test" },
        sources: [staticSource],
      },
      {
        id: "wallpaper-gallery",
        name: "Wallpaper Attachment Gallery",
        file: "wallpaper-gallery.org",
        sourceFile: "blog/wallpaper-gallery.org",
      },
    );

    expect(matched).toBe(staticSource);

    const document = documentViewFromStaticSource(staticSource, {
      start: { year: 2026, month: 5, day: 15 },
      days: 7,
      end: { year: 2026, month: 5, day: 21 },
      label: "2026-05-15 to 2026-05-21",
      limit: 32,
      mode: "classic",
    });

    expect(document.counts.attachments).toBe(1);
    expect(document.counts.memory).toBe(1);
    expect(document.lint).toEqual([]);
    expect(renderView({ view: "gallery", document })).toContain("1 display items");
    expect(
      renderView({
        view: "records",
        document,
        articleHtml: staticSource.html,
      }),
    ).toContain("Static rendered body");
  });
});
