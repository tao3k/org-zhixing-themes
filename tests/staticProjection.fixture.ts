import type {
  OrgizeMemoryRecordDto,
  OrgizeSourceRangeDto,
  OrgizeViewIndexRecordDto,
} from "orgize/dto";
import type { StaticSourceProjection } from "../src/staticSiteData";

export const staticProjection = (): StaticSourceProjection => {
  const source = sourceRange(7);
  return {
    id: "wallpaper-gallery",
    name: "Wallpaper Attachment Gallery",
    file: "wallpaper-gallery.org",
    sourceFile: "blog/wallpaper-gallery.org",
    sourceBytes: 128,
    viewIndex: {
      schemaVersion: 1,
      records: [
        record({
          bodyPreview: "Static preview",
          effectiveTags: ["ATTACH", "memory"],
          outline: "Environments / [[https://example.com/static-gallery][Static Gallery]]",
          rangeStart: 7,
          title: "[[https://example.com/static-gallery][Static Gallery]]",
        }),
      ],
    },
    sectionIndex: {
      schemaVersion: 1,
      records: [
        {
          source,
          outlinePath: ["Environments", "[[https://example.com/static-gallery][Static Gallery]]"],
          outlinePathText: ["Environments", "Static Gallery"],
          level: 1,
          title: "[[https://example.com/static-gallery][Static Gallery]]",
          titleText: "Static Gallery",
          body: [
            {
              source,
              text: "#+DOWNLOADED: https://example.com/static.jpg @ 2026-05-15\n[[attachment:static.jpg]]",
            },
          ],
          todo: null,
          todoState: null,
          priority: {
            effective: "B",
            isDefault: true,
            rangeStatus: "inRange",
            profile: { highest: "A", lowest: "C", default: "B" },
          },
          category: null,
          tags: [],
          effectiveTags: [],
          properties: [],
          effectiveProperties: [],
          specialProperties: [],
          planning: {},
          isComment: false,
          archive: { archived: false, hasArchiveTag: false },
          attachment: { hasAttachTag: false },
          links: [],
          targets: [],
          lifecycle: [],
        },
      ],
    },
    html: "<main><h1>Static Gallery</h1><p>Static rendered body</p></main>",
    attachmentInventory: attachmentInventory(source),
    memory: {
      schemaVersion: 1,
      stats: {
        totalRecords: 1,
        currentRecords: 1,
        backgroundRecords: 0,
        closedRecords: 0,
        archivedRecords: 0,
        cards: 0,
        actionCards: 0,
        suppressedCards: 0,
        infoCards: 0,
        evidence: 0,
        properties: 0,
        links: 0,
        authorityReasons: 0,
      },
      records: [memoryRecord(source)],
      cards: [],
      evidenceKinds: [],
      authorityKinds: [],
    },
    agendaView: {
      schemaVersion: 1,
      totalCandidates: 1,
      limit: 32,
      sortStrategy: [],
      cards: [
        {
          source,
          sortedPosition: 0,
          kind: "scheduled",
          displayDate: "2026-05-15",
          targetDate: "2026-05-15",
          targetEndDate: null,
          time: null,
          endTime: null,
          title: "[[https://example.com/static-gallery][Static Gallery]]",
          category: null,
          todo: null,
          todoState: null,
          effectiveTags: ["ATTACH", "memory"],
          blockers: [],
          urgency: { total: 0, ingredients: [] },
          sortKeys: [],
          receipts: [{ kind: "scheduled", message: "WASM agenda projection" }],
        },
      ],
      skipped: [],
    },
    lint: {
      schemaVersion: 1,
      findings: [],
    },
  };
};

const attachmentInventory = (source: OrgizeSourceRangeDto) => ({
  schemaVersion: 1 as const,
  entries: [
    {
      source,
      sectionTitle: "Static Gallery",
      kind: { label: "link" as const, link: { path: "static.jpg" } },
      path: "static.jpg",
      absolutePath: "/tmp/static.jpg",
      exists: true,
      vcs: {
        status: "notChecked" as const,
        annex: { status: "notChecked" as const },
      },
    },
  ],
  display: [
    {
      source,
      sectionTitle: "Static Gallery",
      sectionTitleText: "Static Gallery",
      outlinePath: ["Static Gallery"],
      outlinePathText: ["Static Gallery"],
      tags: [],
      effectiveTags: [],
      directoryPath: ".attach/id",
      linkPath: "static.jpg",
      absolutePath: "/tmp/static.jpg",
      exists: true,
      mediaKind: "image" as const,
    },
  ],
  syncPlan: { actions: [] },
  archiveAdvice: [],
  warnings: [],
});

const record = ({
  bodyPreview,
  effectiveTags,
  outline,
  rangeStart,
  title,
}: Pick<
  OrgizeViewIndexRecordDto,
  "bodyPreview" | "effectiveTags" | "outline" | "rangeStart" | "title"
>): OrgizeViewIndexRecordDto => ({
  bodyPreview,
  effectiveTags,
  rangeStart,
  title,
  level: 1,
  outline: outline ?? title,
  planning: { scheduled: "<2020-12-19 Sat>-<2020-12-19 Sat>" },
  properties: [],
  todo: null,
  todoState: null,
});

const memoryRecord = (source: OrgizeSourceRangeDto): OrgizeMemoryRecordDto => ({
  source,
  state: "current",
  level: 1,
  title: "Static Gallery",
  todo: null,
  todoState: null,
  tags: ["memory"],
  effectiveTags: ["memory"],
  anchor: null,
  properties: [],
  evidence: [],
  links: [],
});

const sourceRange = (rangeStart: number): OrgizeSourceRangeDto => ({
  start: { line: rangeStart, column: 1 },
  end: { line: rangeStart, column: 1 },
  rangeStart,
  rangeEnd: rangeStart + 10,
});
