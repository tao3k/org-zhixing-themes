import { describe, expect, it } from "vitest";
import {
  documentsNavigationGroups,
  linkedDocumentId,
  linkedNotesStayExpanded,
  openLinkedNoteState,
} from "@org-zhixing/theme-documents";
import type { StaticSourceSummary } from "../src/staticSite/model";

const source = (id: string, sourceFile: string): StaticSourceSummary => ({
  id,
  name: id,
  file: sourceFile.replace(/^docs\//, ""),
  sourceFile,
  sourceBytes: 100,
});

describe("Documents navigation", () => {
  it("projects the lightweight source manifest into documentation groups", () => {
    const groups = documentsNavigationGroups([
      source("index", "docs/index.org"),
      source("architecture", "docs/10_design/architecture.org"),
      source("operations", "docs/90_operations/preview.org"),
    ]);

    expect(groups.map(({ id, label }) => ({ id, label }))).toEqual([
      { id: "overview", label: "Overview" },
      { id: "10_design", label: "Design" },
      { id: "90_operations", label: "Operations" },
    ]);
    expect(groups.flatMap(({ sources }) => sources.map(({ id }) => id))).toEqual([
      "index",
      "architecture",
      "operations",
    ]);
  });

  it("recognizes only corpus-owned document routes as linked notes", () => {
    const ids = new Set(["00-index", "10-architecture-contract"]);

    expect(linkedDocumentId("/10-architecture-contract#rules", ids)).toBe(
      "10-architecture-contract",
    );
    expect(linkedDocumentId("/missing", ids)).toBeNull();
    expect(linkedDocumentId("/10-architecture-contract/extra", ids)).toBeNull();
  });

  it("auto-collapses transient notes while preserving pinned context", () => {
    const notes = openLinkedNoteState(
      [
        {
          collapsed: false,
          html: "first",
          id: "first",
          pinned: false,
          sourceFile: "docs/first.org",
          title: "First",
        },
        {
          collapsed: false,
          html: "pinned",
          id: "pinned",
          pinned: true,
          sourceFile: "docs/pinned.org",
          title: "Pinned",
        },
      ],
      {
        html: "next",
        id: "next",
        sourceFile: "docs/next.org",
        title: "Next",
      },
    );

    expect(notes.map(({ id, collapsed, pinned }) => ({ id, collapsed, pinned }))).toEqual([
      { id: "pinned", collapsed: false, pinned: true },
      { id: "first", collapsed: true, pinned: false },
      { id: "next", collapsed: false, pinned: false },
    ]);
    expect(linkedNotesStayExpanded(notes)).toBe(true);
    expect(linkedNotesStayExpanded(notes.filter((note) => !note.pinned))).toBe(false);
  });
});
