import { describe, expect, it } from "vitest";
import type { SiteConfig, SourceItem } from "../src/config";
import { renderSourceBlocks } from "../src/sourceBlocks";

describe("source navigation blocks", () => {
  it("keeps large Org source sets behind a compact picker-first surface", () => {
    const sources = Array.from({ length: 1000 }, (_, index) => source(index + 1));
    const selected = sources[503];
    const {
      active,
      blocks,
      sources: renderedSources,
    } = renderSourceBlocks(configWithSources(sources), selected.file, null);

    expect(active).toBe(selected);
    expect(renderedSources).toHaveLength(1000);
    expect(blocks).toHaveLength(7);
    expect(
      blocks.filter((block) => block.dataset.sourceId).map((block) => block.dataset.sourceId),
    ).toContain(selected.id);
    expect(blocks.at(-1)?.classList.contains("source-block--summary")).toBe(true);
    expect(blocks.at(-1)?.textContent).toContain("994 more Org files");
  });
});

const source = (index: number): SourceItem => ({
  id: `source-${index}`,
  name: `Source ${index}`,
  file: `source-${index}.org`,
  sourceFile: `blog/source-${index}.org`,
});

const configWithSources = (sources: SourceItem[]): SiteConfig => ({
  title: "Org Zhixing",
  locale: "en",
  contentRoot: "blog",
  defaultSourceId: null,
  defaultView: "blog",
  agenda: {
    start: { year: 2026, month: 5, day: 15 },
    end: { year: 2026, month: 5, day: 21 },
    days: 7,
    limit: 32,
    label: "2026-05-15 to 2026-05-21",
    mode: "classic",
  },
  attachments: {
    attachIdDir: ".attach",
    checkVcs: false,
    checkAnnex: false,
    scanOrphans: false,
  },
  behavior: {
    lazyLint: true,
    showPerformance: false,
  },
  menu: [],
  sources,
});
