import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { validateOrgContracts } from "../src/node/orgContractValidation";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((path) => rm(path, { recursive: true })));
});

describe("Org contract configuration", () => {
  it("rejects a scalar top-level content_dirs value", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "org-zhixing-contracts-"));
    temporaryDirectories.push(cwd);
    const configPath = join(cwd, "org-zhixing.toml");
    await writeFile(configPath, 'content_dirs = "docs"\n[contracts]\nsources = []\n', "utf8");

    await expect(
      validateOrgContracts({
        configPath,
        cwd,
        evaluate: (_source, request) => ({
          schemaVersion: 1,
          path: request.sourcePath ?? "<memory>",
          failed: 0,
          evaluations: [],
        }),
      }),
    ).rejects.toThrow("CONTRACT-E002 content_dirs must be an array of non-empty strings");
  });

  it("rejects a scalar contracts value", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "org-zhixing-contracts-"));
    temporaryDirectories.push(cwd);
    const configPath = join(cwd, "org-zhixing.toml");
    await writeFile(configPath, 'contracts = "invalid"\n', "utf8");

    await expect(
      validateOrgContracts({
        configPath,
        cwd,
        evaluate: (_source, request) => ({
          schemaVersion: 1,
          path: request.sourcePath ?? "<memory>",
          failed: 0,
          evaluations: [],
        }),
      }),
    ).rejects.toThrow("CONTRACT-E002 contracts must be a TOML table");
  });

  it("rejects scalar contract sources with an agent-fixable diagnostic", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "org-zhixing-contracts-"));
    temporaryDirectories.push(cwd);
    const configPath = join(cwd, "org-zhixing.toml");
    await writeFile(
      configPath,
      '[contracts]\nsources = "contracts/document-contracts.org"\n',
      "utf8",
    );

    await expect(
      validateOrgContracts({
        configPath,
        cwd,
        evaluate: (_source, request) => ({
          schemaVersion: 1,
          path: request.sourcePath ?? "<memory>",
          failed: 0,
          evaluations: [],
        }),
      }),
    ).rejects.toThrow("CONTRACT-E002 contracts.sources must be an array of non-empty strings");
  });
});
