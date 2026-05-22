import { afterEach, describe, expect, it } from "vitest";
import { writeAppUrlState } from "../src/urlState";

describe("Blog URL state", () => {
  afterEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("keeps index filters in the route and clears them for Zen reading", () => {
    writeAppUrlState({
      view: "blog",
      source: null,
      agendaMode: "classic",
      agendaPanel: "trace",
      agendaRuleId: null,
      blog: {
        articleRangeStart: null,
        tagFilter: "syntax",
        timeFilter: "2026-05-13..2026-05-17",
        zenMode: false,
      },
    });

    let url = new URL(window.location.href);
    expect(url.searchParams.get("view")).toBe("blog");
    expect(url.searchParams.get("tag")).toBe("syntax");
    expect(url.searchParams.get("time")).toBe("2026-05-13..2026-05-17");
    expect(url.searchParams.get("article")).toBeNull();

    writeAppUrlState({
      view: "blog",
      source: null,
      agendaMode: "classic",
      agendaPanel: "trace",
      agendaRuleId: null,
      blog: {
        articleRangeStart: 42,
        tagFilter: "syntax",
        timeFilter: "2026-05-13..2026-05-17",
        zenMode: true,
      },
    });

    url = new URL(window.location.href);
    expect(url.searchParams.get("article")).toBe("42");
    expect(url.searchParams.get("zen")).toBe("1");
    expect(url.searchParams.get("tag")).toBeNull();
    expect(url.searchParams.get("time")).toBeNull();
  });

  it("clears Blog-specific route state when leaving Blog", () => {
    window.history.replaceState(null, "", "/?view=blog&tag=syntax&time=2026-05-17&zen=1");

    writeAppUrlState({
      view: "travel",
      source: null,
      agendaMode: "classic",
      agendaPanel: "trace",
      agendaRuleId: null,
      blog: {
        articleRangeStart: null,
        tagFilter: "syntax",
        timeFilter: "2026-05-17",
        zenMode: false,
      },
    });

    const url = new URL(window.location.href);
    expect(url.searchParams.get("view")).toBe("travel");
    expect(url.searchParams.get("tag")).toBeNull();
    expect(url.searchParams.get("time")).toBeNull();
    expect(url.searchParams.get("zen")).toBeNull();
  });
});
