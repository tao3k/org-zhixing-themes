import { afterEach, describe, expect, it, vi } from "vitest";

describe("static knowledge graph cache", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("shares one in-flight static shard request across graph scenarios", async () => {
    const fetchGraph = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ schemaVersion: 1, nodes: [], relations: [] }),
    });
    vi.stubGlobal("fetch", fetchGraph);
    const { loadStaticKnowledgeGraph } = await import("../src/staticSiteData");
    const staticSite = {
      knowledgeGraph: {
        shardPath: "org-zhixing.knowledge-graph.json",
        nodeCount: 0,
        relationCount: 0,
      },
    } as never;

    const graphRequest = loadStaticKnowledgeGraph(staticSite);
    const mindMapRequest = loadStaticKnowledgeGraph(staticSite);

    expect(mindMapRequest).toBe(graphRequest);
    await expect(Promise.all([graphRequest, mindMapRequest])).resolves.toEqual([
      { schemaVersion: 1, nodes: [], relations: [] },
      { schemaVersion: 1, nodes: [], relations: [] },
    ]);
    expect(fetchGraph).toHaveBeenCalledTimes(1);
  });
});
