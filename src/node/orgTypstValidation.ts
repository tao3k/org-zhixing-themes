import { promises as fs } from "node:fs";
import path from "node:path";

import { $typst } from "@myriaddreamin/typst.ts";

import { prepareTypstPreviewSource } from "../core/typstSource";

export interface OrgTypstBlock {
  filePath: string;
  line: number;
  source: string;
}

export interface OrgTypstValidationResult {
  blocks: number;
  files: number;
}

const typstBlockPattern =
  /^[\t ]*#\+begin_src[\t ]+(?:typst|typ)\b[^\n]*\r?\n([\s\S]*?)^[\t ]*#\+end_src\b/gim;

export const formatTypstDiagnostic = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;

  try {
    const serialized = JSON.stringify(error, null, 2);
    if (serialized && serialized !== "{}") return serialized;
  } catch {
    // Fall through to String for compiler-owned diagnostic values.
  }

  const message = String(error);
  return message && message !== "[object Object]" ? message : "Typst compilation failed";
};

export const extractOrgTypstBlocks = (filePath: string, content: string): OrgTypstBlock[] =>
  [...content.matchAll(typstBlockPattern)].map((match) => ({
    filePath,
    line: content.slice(0, match.index).split(/\r?\n/).length + 1,
    source: match[1],
  }));

const findOrgFiles = async (root: string): Promise<string[]> => {
  const stat = await fs.stat(root);
  if (stat.isFile()) return root.endsWith(".org") ? [root] : [];

  const entries = await fs.readdir(root, { withFileTypes: true });
  const nested = await Promise.all(
    entries
      .filter((entry) => !entry.name.startsWith("."))
      .map((entry) => findOrgFiles(path.join(root, entry.name))),
  );
  return nested.flat();
};

export const validateOrgTypst = async (roots: string[]): Promise<OrgTypstValidationResult> => {
  const files = (await Promise.all(roots.map((root) => findOrgFiles(path.resolve(root))))).flat();
  const blocks = (
    await Promise.all(
      files.map(async (filePath) =>
        extractOrgTypstBlocks(filePath, await fs.readFile(filePath, "utf8")),
      ),
    )
  ).flat();
  const failures: string[] = [];

  for (const block of blocks) {
    try {
      await $typst.svg({ mainContent: prepareTypstPreviewSource(block.source) });
    } catch (error) {
      failures.push(`${block.filePath}:${block.line}: ${formatTypstDiagnostic(error)}`);
    }
  }

  if (failures.length > 0) {
    throw new Error(`org-typst failed blocks=${failures.length}\n${failures.join("\n")}`);
  }

  return { blocks: blocks.length, files: files.length };
};
