import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repositoryRoot = resolve(import.meta.dirname, "..");
const ciWorkflowPath = resolve(repositoryRoot, ".github/workflows/ci.yml");
const legacyWorkflowPath = resolve(repositoryRoot, ".github/workflows/github-page.yml");

describe("GitHub Pages workflow", () => {
  it("deploys the build artifact only after the complete CI gates pass", () => {
    const workflow = readFileSync(ciWorkflowPath, "utf8");

    expect(workflow).toContain("actions/configure-pages@v6");
    expect(workflow).toContain("actions/upload-pages-artifact@v5");
    expect(workflow).toContain("actions/deploy-pages@v5");
    expect(workflow).toMatch(
      /pages-artifact:[\s\S]*needs:\s*\n\s*- npm-test\s*\n\s*- scenario-mobile/,
    );
    expect(workflow).toMatch(/deploy-pages:[\s\S]*needs:\s*\n\s*- pages-artifact/);
    expect(workflow).toContain("name: github-pages");
    expect(workflow).toContain("pages: write");
    expect(workflow).toContain("id-token: write");
  });

  it("does not retain the legacy branch-publishing workflow", () => {
    expect(existsSync(legacyWorkflowPath)).toBe(false);
  });
});
