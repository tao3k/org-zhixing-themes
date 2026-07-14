import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("external documents preview", () => {
  it("does not publish the theme builder's demo public directory", () => {
    const rsbuildConfig = readFileSync("rsbuild.config.ts", "utf8");
    expect(rsbuildConfig).toContain("copyOnBuild: !externalContentRoot");
  });

  it("projects LaTeX and Typst source from an external Org corpus", () => {
    const root = mkdtempSync(join(tmpdir(), "org-zhixing-external-docs-"));
    const contentDir = join(root, "docs");
    const outputDir = join(root, "cache");
    mkdirSync(contentDir);
    writeFileSync(
      join(contentDir, "latex-typst.org"),
      `#+title: LaTeX and Typst

Inline math: \\(E = mc^2\\)

#+begin_src latex
\\frac{a}{b}
#+end_src

#+begin_src typst
= Typst
$ integral_0^1 x dif x $
#+end_src
`,
      "utf8",
    );

    try {
      execFileSync("node", ["--import", "tsx", "scripts/generate-static-site.mjs"], {
        env: {
          ...process.env,
          ORG_ZHIXING_CACHE_ROOT: outputDir,
          ORG_ZHIXING_CONTENT_DIR: contentDir,
        },
        stdio: "pipe",
      });
      const manifest = JSON.parse(readFileSync(join(outputDir, "static-site.json"), "utf8")) as {
        sources: Array<{ shardPath: string; sourceFile: string }>;
      };
      const source = manifest.sources[0];
      expect(source?.sourceFile).toBe("docs/latex-typst.org");
      const shard = readFileSync(join(outputDir, source!.shardPath), "utf8");
      expect(shard).toContain('class=\\"language-latex\\"');
      expect(shard).toContain('class=\\"language-typst\\"');
      expect(shard).toContain("\\\\(E = mc^2\\\\)");
    } finally {
      rmSync(root, { force: true, recursive: true });
    }
  }, 15_000);
});
