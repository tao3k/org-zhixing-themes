import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("theme registry generator", () => {
  it("imports every discovered theme while retaining the configured selection", () => {
    const root = mkdtempSync(join(tmpdir(), "org-zhixing-registry-"));
    roots.push(root);
    const config = join(root, "org-zhixing.toml");
    const output = join(root, "themeRegistry.ts");
    writeFileSync(config, 'theme = "minimal-notes"\ntheme_variant = "midnight"\n');

    const result = spawnSync(process.execPath, ["scripts/generate-theme-registry.mjs"], {
      encoding: "utf8",
      env: {
        ...process.env,
        ORG_ZHIXING_CONFIG: config,
        ORG_ZHIXING_THEME_REGISTRY_OUTPUT: output,
      },
    });
    const generated = readFileSync(output, "utf8");

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("selected=minimal-notes variant=midnight catalog=2");
    expect(generated).toContain('import theme0 from "@org-zhixing/theme-elegant-blog"');
    expect(generated).toContain('import theme1 from "@org-zhixing/theme-minimal-notes"');
    expect(generated).toContain('"id": "elegant-blog"');
    expect(generated).toContain('["elegant-blog", theme0]');
    expect(generated).toContain('["minimal-notes", theme1]');
  });

  it("rejects an unknown configured theme before writing runtime imports", () => {
    const root = mkdtempSync(join(tmpdir(), "org-zhixing-registry-"));
    roots.push(root);
    const config = join(root, "org-zhixing.toml");
    const output = join(root, "themeRegistry.ts");
    writeFileSync(config, 'theme = "missing-theme"\n');
    const result = spawnSync(process.execPath, ["scripts/generate-theme-registry.mjs"], {
      encoding: "utf8",
      env: {
        ...process.env,
        ORG_ZHIXING_CONFIG: config,
        ORG_ZHIXING_THEME_REGISTRY_OUTPUT: output,
      },
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('THEME-E001 unknown theme "missing-theme"');
  });

  it("keeps the shared registry complete under concurrent theme selections", async () => {
    const root = mkdtempSync(join(tmpdir(), "org-zhixing-registry-"));
    roots.push(root);
    const elegantConfig = join(root, "elegant.toml");
    const minimalConfig = join(root, "minimal.toml");
    const output = join(root, "themeRegistry.ts");
    writeFileSync(elegantConfig, 'theme = "elegant-blog"\n');
    writeFileSync(minimalConfig, 'theme = "minimal-notes"\ntheme_variant = "paper"\n');

    const results = await Promise.all([
      runGenerator(elegantConfig, output),
      runGenerator(minimalConfig, output),
    ]);
    const generated = readFileSync(output, "utf8");

    expect(results.map(({ code }) => code)).toEqual([0, 0]);
    expect(generated).toContain('["elegant-blog", theme0]');
    expect(generated).toContain('["minimal-notes", theme1]');
  });
});

function runGenerator(config: string, output: string): Promise<{ code: number | null }> {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ["scripts/generate-theme-registry.mjs"], {
      env: {
        ...process.env,
        ORG_ZHIXING_CONFIG: config,
        ORG_ZHIXING_THEME_REGISTRY_OUTPUT: output,
      },
      stdio: "ignore",
    });
    child.once("exit", (code) => resolve({ code }));
  });
}
