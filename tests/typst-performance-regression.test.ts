import { performance } from "node:perf_hooks";
import { describe, expect, it } from "vitest";
import { BoundedLruCache } from "../src/core/boundedLruCache";

const sample = (run: () => void, iterations = 7): number[] => {
  const timings: number[] = [];
  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const start = performance.now();
    run();
    timings.push(performance.now() - start);
  }
  return timings.sort((left, right) => left - right);
};

describe("Typst render-cache performance regression", () => {
  it("keeps repeated source lookup below the main-thread frame budget", () => {
    const cache = new BoundedLruCache<string, string>(64);
    const source = "$ integral_0^1 x dif x $";
    cache.set(source, "<svg />");

    let rendered = "";
    const timings = sample(() => {
      for (let lookup = 0; lookup < 10_000; lookup += 1) {
        rendered = cache.get(source) ?? "";
      }
    });
    const p95 = timings[Math.ceil(timings.length * 0.95) - 1] ?? Infinity;

    expect(rendered).toBe("<svg />");
    expect(p95).toBeLessThan(16);
  });

  it("bounds a multi-document preview session without losing the hot source", () => {
    const cache = new BoundedLruCache<string, string>(64);
    cache.set("hot", "<svg id='hot' />");

    for (let source = 0; source < 256; source += 1) {
      cache.get("hot");
      cache.set(`source-${source}`, `<svg id='${source}' />`);
    }

    expect(cache.size).toBe(64);
    expect(cache.get("hot")).toBe("<svg id='hot' />");
  });
});
