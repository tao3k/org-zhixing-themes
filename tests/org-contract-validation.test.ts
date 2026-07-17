import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  formatOrgContractDiagnostic,
  validateOrgContracts,
} from "../src/node/orgContractValidation";

describe("Org contract deployment validation", () => {
  it("skips sites without a contracts table", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "org-contract-skip-"));
    await writeFile(join(cwd, "org-zhixing.toml"), '[content]\ncontent_dir = "docs"\n');

    const result = await validateOrgContracts({
      cwd,
      configPath: "org-zhixing.toml",
      evaluate: () => {
        throw new Error("should not evaluate");
      },
    });

    expect(result).toEqual({ checked: 0, diagnostics: [], skipped: true });
  });

  it("applies registry contracts and reports agent-fixable diagnostics", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "org-contract-site-"));
    await mkdir(join(cwd, "docs"));
    await mkdir(join(cwd, "contracts"));
    await writeFile(join(cwd, "docs", "page.org"), "* Page\n");
    await writeFile(join(cwd, "contracts", "site.org"), "* Contract\n");
    await writeFile(
      join(cwd, "org-zhixing.toml"),
      [
        "[content]",
        'content_dir = "docs"',
        "[contracts]",
        'registries = ["contracts/site.org"]',
        'defaults = ["site.document"]',
      ].join("\n"),
    );

    const result = await validateOrgContracts({
      cwd,
      configPath: "org-zhixing.toml",
      evaluate: (_source, request) => ({
        schemaVersion: 1,
        path: request.sourcePath,
        failed: 1,
        evaluations: [
          {
            contractId: "site.document",
            scope: { kind: "document" },
            assertions: [
              {
                assertionId: "title.exists",
                severity: "error",
                expectation: { kind: "exists" },
                actualCount: 0,
                status: "failed",
                messageTemplate: "Add a title",
                fixTemplate: "#+TITLE: ${title}",
              },
            ],
          },
        ],
      }),
    });

    expect(result.checked).toBe(1);
    expect(result.diagnostics).toHaveLength(1);
    expect(formatOrgContractDiagnostic(result.diagnostics[0])).toContain(
      "CONTRACT-E001 docs/page.org site.document#title.exists",
    );
    expect(formatOrgContractDiagnostic(result.diagnostics[0])).toContain('fix="#+TITLE: ${title}"');
  });
});
