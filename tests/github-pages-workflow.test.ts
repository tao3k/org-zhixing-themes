import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repositoryRoot = resolve(import.meta.dirname, "..");
const ciWorkflowPath = resolve(repositoryRoot, ".github/workflows/ci.yml");
const legacyWorkflowPath = resolve(repositoryRoot, ".github/workflows/github-page.yml");
const downstreamGuidePath = resolve(
  repositoryRoot,
  "docs/90_operations/90.04_github_pages_deployment.org",
);

describe("GitHub Pages workflow", () => {
  it("deploys the build artifact only after the complete CI gates pass", () => {
    const workflow = readFileSync(ciWorkflowPath, "utf8");

    expect(workflow).toContain("actions/checkout@v7");
    expect(workflow).toContain("actions/setup-node@v6");
    expect(workflow).not.toContain("actions/checkout@v4");
    expect(workflow).not.toContain("actions/setup-node@v4");
    expect(workflow).toContain("actions/configure-pages@v6");
    expect(workflow).toContain("actions/upload-pages-artifact@v5");
    expect(workflow).toContain("actions/deploy-pages@v5");
    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).toMatch(
      /pages-artifact:[\s\S]*github\.event_name == 'push' \|\| github\.event_name == 'workflow_dispatch'/,
    );
    expect(workflow).toMatch(
      /deploy-pages:[\s\S]*github\.event_name == 'push' \|\| github\.event_name == 'workflow_dispatch'/,
    );
    expect(workflow).toMatch(
      /pages-artifact:[\s\S]*needs:\s*\n\s*- npm-test\s*\n\s*- scenario-mobile/,
    );
    expect(workflow).toMatch(/deploy-pages:[\s\S]*needs:\s*\n\s*- pages-artifact/);
    expect(workflow).toContain("name: github-pages");
    expect(workflow).toContain("pages: write");
    expect(workflow).toContain("id-token: write");
    expect(workflow).toContain("url: ${{ steps.deployment.outputs.page_url }}");
    expect(workflow.indexOf("Lighthouse mobile scenarios")).toBeLessThan(
      workflow.indexOf("Cross-engine mobile scenarios"),
    );
  });

  it("does not retain the legacy branch-publishing workflow", () => {
    expect(existsSync(legacyWorkflowPath)).toBe(false);
  });

  it("keeps downstream builders in runner temporary storage", () => {
    const guide = readFileSync(downstreamGuidePath, "utf8");

    expect(guide).toContain("${{ runner.temp }}/org-zhixing");
    expect(guide).toContain("npm run pages:build --");
    expect(guide).toContain("ORG_ZHIXING_CONTENT_DIR");
    expect(guide).toContain('theme = "documents"');
    expect(guide).toContain('content_base = "workspace"');
    expect(guide).not.toContain(".data/org-zhixing");
  });
});
