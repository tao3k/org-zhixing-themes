import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const config = require("../benchmarks/lighthouserc.cjs");

describe("Lighthouse scenario configuration", () => {
  it("keeps four deployment routes and three runs on the managed static server", () => {
    const collect = config.ci.collect;
    const paths = collect.url.map((value: string) => new URL(value).pathname);

    expect(collect.numberOfRuns).toBe(3);
    expect(paths).toEqual([
      "/org-zhixing-themes/blogs",
      "/org-zhixing-themes/gallery/",
      "/org-zhixing-themes/travel/",
      "/org-zhixing-themes/agenda",
    ]);
    expect(paths).toHaveLength(4);
    expect(new Set(paths).size).toBe(4);
    expect(collect.staticDistDir).toBe("./.cache/lighthouse");
    expect(collect.isSinglePageApplication).toBe(true);
    expect(collect.startServerCommand).toBeUndefined();
    expect(collect.startServerReadyPattern).toBeUndefined();
    expect(config.ci.assert.assertions["largest-contentful-paint"]).toEqual([
      "warn",
      { maxNumericValue: 3300, aggregationMethod: "median" },
    ]);
  });
});
