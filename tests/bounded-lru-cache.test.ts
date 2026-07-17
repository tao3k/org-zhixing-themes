import { describe, expect, it } from "vitest";
import { BoundedLruCache } from "../src/core/boundedLruCache";

describe("BoundedLruCache", () => {
  it("retains hot entries and evicts the least recently used value", () => {
    const cache = new BoundedLruCache<string, string>(2);
    cache.set("first", "A");
    cache.set("second", "B");

    expect(cache.get("first")).toBe("A");
    cache.set("third", "C");

    expect(cache.get("second")).toBeUndefined();
    expect(cache.get("first")).toBe("A");
    expect(cache.get("third")).toBe("C");
  });

  it("rejects an unbounded or empty capacity", () => {
    expect(() => new BoundedLruCache(0)).toThrow(RangeError);
  });
});
