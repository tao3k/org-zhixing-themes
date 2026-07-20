import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parse } from "smol-toml";

export interface OrgContractRegistrySource {
  path: string;
  source: string;
}

export interface OrgContractEvaluationRequest {
  registrySources: OrgContractRegistrySource[];
  contractIds: string[];
  applyRegistryContracts?: boolean;
  sourcePath: string;
}

export interface OrgContractAssertionReceipt {
  assertionId: string;
  severity: "error" | "warning";
  expectation: unknown;
  actualCount: number;
  status: "passed" | "failed";
  messageTemplate?: string;
  fixTemplate?: string;
}

export interface OrgContractEvaluationReceipt {
  contractId: string;
  scope: { kind: "document" | "section"; [key: string]: unknown };
  assertions: OrgContractAssertionReceipt[];
}

export interface OrgContractFileReceipt {
  schemaVersion: 1;
  path: string;
  failed: number;
  evaluations: OrgContractEvaluationReceipt[];
}

interface ContractConfiguration {
  registries?: string[];
  defaults?: string[];
}

interface SiteConfiguration {
  content?: { content_dir?: string };
  contracts?: ContractConfiguration;
}

export interface OrgContractDiagnostic extends OrgContractAssertionReceipt {
  path: string;
  contractId: string;
}

export interface ValidateOrgContractsOptions {
  configPath: string;
  cwd?: string;
  evaluate: (source: string, request: OrgContractEvaluationRequest) => OrgContractFileReceipt;
}

const orgFiles = async (directory: string): Promise<string[]> => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) return orgFiles(path);
      return entry.isFile() && entry.name.endsWith(".org") ? [path] : [];
    }),
  );
  return files.flat().sort();
};

export const validateOrgContracts = (options: ValidateOrgContractsOptions) =>
  validateOrgContractsImplementation(options);

const validateOrgContractsImplementation = async ({
  configPath,
  cwd = process.cwd(),
  evaluate,
}: ValidateOrgContractsOptions): Promise<{
  checked: number;
  diagnostics: OrgContractDiagnostic[];
  skipped: boolean;
}> => {
  const absoluteConfigPath = resolve(cwd, configPath);
  const config = parse(await readFile(absoluteConfigPath, "utf8")) as SiteConfiguration;
  if (!config.contracts) return { checked: 0, diagnostics: [], skipped: true };

  if (
    typeof config.contracts !== "object" ||
    config.contracts === null ||
    Array.isArray(config.contracts)
  ) {
    throw new Error("CONTRACT-E002 contracts must be a TOML table");
  }
  const contractOptions = config.contracts as typeof config.contracts & {
    sources?: unknown;
  };
  const sources = contractOptions.sources;
  const registries = sources ?? config.contracts.registries;
  for (const [key, value] of [
    [sources === undefined ? "contracts.registries" : "contracts.sources", registries],
  ] as const) {
    if (
      value !== undefined &&
      (!Array.isArray(value) ||
        value.some((item) => typeof item !== "string" || item.trim().length === 0))
    ) {
      throw new Error(`CONTRACT-E002 ${key} must be an array of non-empty strings`);
    }
  }
  const registrySources = await Promise.all(
    ((registries ?? []) as string[]).map(async (path) => ({
      path,
      source: await readFile(resolve(cwd, path), "utf8"),
    })),
  );
  const rootContentDirectories = (config as typeof config & { content_dirs?: unknown })
    .content_dirs;
  const nestedContentDirectories = (
    config.content as typeof config.content & { content_dirs?: unknown }
  )?.content_dirs;
  const configuredContentDirectories = rootContentDirectories ?? nestedContentDirectories;
  if (
    configuredContentDirectories !== undefined &&
    (!Array.isArray(configuredContentDirectories) ||
      configuredContentDirectories.some(
        (item) => typeof item !== "string" || item.trim().length === 0,
      ))
  ) {
    throw new Error("CONTRACT-E002 content_dirs must be an array of non-empty strings");
  }
  const contentDirectories = (configuredContentDirectories ?? [
    config.content?.content_dir ?? "docs",
  ]) as string[];
  const files = [
    ...new Set(
      (await Promise.all(contentDirectories.map((path) => orgFiles(resolve(cwd, path))))).flat(),
    ),
  ].sort();
  const diagnostics: OrgContractDiagnostic[] = [];
  for (const path of files) {
    const sourcePath = path.slice(cwd.length + 1);
    const receipt = evaluate(await readFile(path, "utf8"), {
      registrySources,
      contractIds: [],
      applyRegistryContracts: true,
      sourcePath,
    });
    if (registrySources.length > 0 && receipt.evaluations.length === 0) {
      throw new Error(
        `CONTRACT-E005 ${sourcePath} no document contracts from contracts.sources were applied`,
      );
    }
    for (const evaluation of receipt.evaluations) {
      for (const assertion of evaluation.assertions) {
        if (assertion.status === "failed") {
          diagnostics.push({ path: sourcePath, contractId: evaluation.contractId, ...assertion });
        }
      }
    }
  }
  return { checked: files.length, diagnostics, skipped: false };
};

export const formatOrgContractDiagnostic = (diagnostic: OrgContractDiagnostic): string => {
  const details = [
    `CONTRACT-E001 ${diagnostic.path}`,
    `${diagnostic.contractId}#${diagnostic.assertionId}`,
    `severity=${diagnostic.severity}`,
    `expected=${JSON.stringify(diagnostic.expectation)}`,
    `actual=${diagnostic.actualCount}`,
  ];
  if (diagnostic.messageTemplate) {
    details.push(`message=${JSON.stringify(diagnostic.messageTemplate)}`);
  }
  if (diagnostic.fixTemplate) details.push(`fix=${JSON.stringify(diagnostic.fixTemplate)}`);
  return details.join(" ");
};
