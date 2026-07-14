import { describe, expect, it } from "vitest";
import { createOrgSearchIndex, type OrgSearchDocument } from "../src/orgSearch";
import { isOrgSearchShortcut } from "../src/react/orgSearchEvents";

const document = (id: string, overrides: Partial<OrgSearchDocument> = {}): OrgSearchDocument => ({
  id,
  kind: "section",
  path: `docs/${id}.org`,
  route: `/${id}`,
  sourceId: id,
  tags: "",
  text: "",
  title: id,
  todo: "",
  ...overrides,
});

describe("Org search index", () => {
  it("ranks titles, Org tags, TODO state, paths, and fuzzy prefixes", () => {
    const index = createOrgSearchIndex([
      document("architecture", {
        tags: "design contract",
        text: "Static source projection and theme package boundaries",
        title: "Content Directory Contract",
        todo: "TODO",
      }),
      document("operations", {
        path: "docs/90_operations/performance.org",
        text: "Scenario benchmark receipts",
        title: "Performance Notes",
      }),
    ]);

    expect(index.search("content contract")[0]?.sourceId).toBe("architecture");
    expect(index.search("perfrmance")[0]?.sourceId).toBe("operations");
    expect(index.search("TODO design")[0]?.sourceId).toBe("architecture");
    expect(index.count).toBe(2);
  });

  it("owns Ctrl+F and Command+F without claiming unrelated shortcuts", () => {
    expect(isOrgSearchShortcut({ ctrlKey: true, key: "f", metaKey: false })).toBe(true);
    expect(isOrgSearchShortcut({ ctrlKey: false, key: "F", metaKey: true })).toBe(true);
    expect(isOrgSearchShortcut({ ctrlKey: false, key: "f", metaKey: false })).toBe(false);
    expect(isOrgSearchShortcut({ ctrlKey: true, key: "k", metaKey: false })).toBe(false);
  });
});
