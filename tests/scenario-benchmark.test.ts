import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import { describe, expect, it } from "vitest";

describe("Scenario Benchmark contracts", () => {
  it("keeps every Git scenario valid against the versioned schema", () => {
    const schema = JSON.parse(readFileSync("benchmarks/schema/scenario.schema.json", "utf8"));
    const validate = new Ajv2020({ allErrors: true }).compile(schema);
    const files = readdirSync("benchmarks/scenarios").filter((file) => file.endsWith(".json"));

    expect(files.sort()).toEqual([
      "agenda-cockpit.json",
      "article-zen.json",
      "blog-index.json",
      "gallery-heavy.json",
      "poo-flow-runtime.json",
      "poo-flow-subflows.json",
      "theme-minimal-mobile.json",
      "travel-heavy.json",
    ]);
    const themeScenario = "themes/documents/benchmarks/scenarios/theme-documents-mobile.json";
    expect(validate(JSON.parse(readFileSync(themeScenario, "utf8"))), themeScenario).toBe(true);
    for (const file of files) {
      const scenario = JSON.parse(readFileSync(join("benchmarks/scenarios", file), "utf8"));
      expect(validate(scenario), `${file}: ${JSON.stringify(validate.errors)}`).toBe(true);
    }
  });

  it("tracks deterministic build limits while bounding installed theme markers", () => {
    const baseline = JSON.parse(readFileSync("benchmarks/baselines/deterministic.json", "utf8"));
    const packageJson = JSON.parse(readFileSync("package.json", "utf8"));

    expect(baseline.schemaVersion).toBe(1);
    expect(baseline.observed.artifactJsBytes).toBeGreaterThan(0);
    expect(baseline.observed.initialJsBytes).toBeGreaterThan(0);
    expect(baseline.observed.entryJsBytes).toBeGreaterThan(0);
    expect(baseline.observed.initialJsBytes).toBeLessThan(baseline.observed.artifactJsBytes);
    expect(baseline.limits.artifactJsBytes).toBeGreaterThanOrEqual(
      baseline.observed.artifactJsBytes,
    );
    expect(baseline.limits.initialJsBytes).toBeGreaterThanOrEqual(baseline.observed.initialJsBytes);
    expect(baseline.limits.unselectedThemeMarkers).toBe(0);
    expect(baseline.observed.unselectedThemeMarkers).toBeLessThanOrEqual(
      baseline.limits.unselectedThemeMarkers,
    );
    expect(packageJson.scripts.ci).toContain("npm run build && npm run scenario:check");
    expect(packageJson.scripts["scenario:update-baseline"]).not.toBe(
      packageJson.scripts["scenario:check"],
    );
  });
});
