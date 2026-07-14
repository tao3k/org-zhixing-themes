import { Window } from "happy-dom";
import { describe, expect, it } from "vitest";
import { projectOrgDocumentLinks } from "../src/node/orgDocumentLinks.mjs";
import { orgDocumentIdFromPath, resolveOrgLinkHref } from "../src/orgIdLinks";

describe("Org document link projection", () => {
  it("owns stable document IDs and Org link resolution in the core", () => {
    const documents = [
      { file: "20_design/20.01_elegant_system.org", id: "20-design-20-01-elegant-system" },
      {
        file: "10_architecture/10.02_agent_travel_projection.org",
        id: "10-architecture-10-02-agent-travel-projection",
      },
    ];

    expect(orgDocumentIdFromPath("10_architecture/10.02_agent_travel_projection.org")).toBe(
      "10-architecture-10-02-agent-travel-projection",
    );
    expect(
      resolveOrgLinkHref("../20_design/20.01_elegant_system.org", {
        currentFile: "10_architecture/10.01_content_directory_contract.org",
        documents,
      }),
    ).toBe("/20-design-20-01-elegant-system");
    expect(
      resolveOrgLinkHref("file:10.02_agent_travel_projection.org#contract", {
        currentFile: "10_architecture/10.01_content_directory_contract.org",
        documents,
      }),
    ).toBe("/10-architecture-10-02-agent-travel-projection#contract");
    expect(resolveOrgLinkHref("id:known", { idTargets: new Map([["known", "#target"]]) })).toBe(
      "#target",
    );
    expect(resolveOrgLinkHref("id:missing", { idTargets: new Map() })).toBeNull();
    expect(resolveOrgLinkHref("https://example.com/reference.org", { documents })).toBeNull();
  });

  it("maps known relative Org sources onto canonical document routes", () => {
    const document = new Window().document;
    const html = projectOrgDocumentLinks(
      [
        '<a href="../20_design/20.01_elegant_system.org">Elegant</a>',
        '<a href="file:10.02_agent_travel_projection.org#contract">Travel</a>',
        '<a href="topology.toml">Topology</a>',
        '<a href="https://example.com/reference.org">External</a>',
      ].join(""),
      {
        currentFile: "10_architecture/10.01_content_directory_contract.org",
        document,
        sources: [
          { file: "20_design/20.01_elegant_system.org", id: "20-design-20-01-elegant-system" },
          {
            file: "10_architecture/10.02_agent_travel_projection.org",
            id: "10-architecture-10-02-agent-travel-projection",
          },
        ],
      },
    );

    expect(html).toContain('href="/20-design-20-01-elegant-system"');
    expect(html).toContain('href="/10-architecture-10-02-agent-travel-projection#contract"');
    expect(html).toContain('href="topology.toml"');
    expect(html).toContain('href="https://example.com/reference.org"');
  });
});
