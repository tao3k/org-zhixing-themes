import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("theme workspace CLI", () => {
  it("creates a workspace theme that immediately passes theme check", () => {
    const root = mkdtempSync(join(tmpdir(), "org-zhixing-theme-"));
    roots.push(root);

    const created = execFileSync(
      process.execPath,
      ["packages/theme-tooling/src/theme-create.mjs", "field-notes", "--root", root],
      { encoding: "utf8" },
    );
    const themeRoot = join(root, "themes/field-notes");
    const checked = execFileSync(
      process.execPath,
      ["packages/theme-tooling/src/theme-check.mjs", themeRoot],
      {
        encoding: "utf8",
      },
    );
    const packageJson = JSON.parse(readFileSync(join(themeRoot, "package.json"), "utf8"));

    expect(created).toContain("theme-create status=ok id=field-notes");
    expect(checked).toContain("theme-check status=ok id=field-notes");
    expect(packageJson.name).toBe("@org-zhixing/theme-field-notes");
    expect(packageJson.orgZhixing.publicSlots[0]).toMatchObject({
      id: "site-header",
      strategies: ["wrap", "replace"],
      stability: "stable",
    });
    expect(existsSync(join(themeRoot, "src/index.ts"))).toBe(true);
    expect(existsSync(join(themeRoot, "theme-config.schema.json"))).toBe(true);
  });

  it("rejects invalid ids and existing theme directories", () => {
    const root = mkdtempSync(join(tmpdir(), "org-zhixing-theme-"));
    roots.push(root);

    const invalid = spawnSync(
      process.execPath,
      ["packages/theme-tooling/src/theme-create.mjs", "Bad Theme", "--root", root],
      { encoding: "utf8" },
    );
    expect(invalid.status).not.toBe(0);
    expect(invalid.stderr).toContain("THEME-E009 theme id must be lower-case kebab-case");
    execFileSync(process.execPath, [
      "packages/theme-tooling/src/theme-create.mjs",
      "field-notes",
      "--root",
      root,
    ]);
    const duplicate = spawnSync(
      process.execPath,
      ["packages/theme-tooling/src/theme-create.mjs", "field-notes", "--root", root],
      { encoding: "utf8" },
    );
    expect(duplicate.status).not.toBe(0);
    expect(duplicate.stderr).toContain("THEME-E009 theme directory already exists");
  });
});
