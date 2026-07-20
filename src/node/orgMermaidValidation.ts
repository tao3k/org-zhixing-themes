import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { orgFiles } from "./orgSources";

export type OrgMermaidBlock = {
  block: number;
  file: string;
  line: number;
  source: string;
  terminated: boolean;
};

export type OrgMermaidDiagnostic = {
  code: "MERMAID-E001" | "MERMAID-E002";
  file: string;
  block: number;
  line: number;
  message: string;
};

export type MermaidParser = (source: string) => Promise<unknown>;

const beginPattern = /^\s*#\+begin_src\s+mermaid(?:\s+.*)?$/iu;
const endPattern = /^\s*#\+end_src\s*$/iu;
const ansiSgrPattern = new RegExp(String.raw`\u001B\[[0-9;]*m`, "gu");

export const extractOrgMermaidBlocks = (source: string, file: string): OrgMermaidBlock[] => {
  const lines = source.split(/\r?\n/u);
  const blocks: OrgMermaidBlock[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    if (!beginPattern.test(lines[index])) continue;
    const begin = index;
    const body: string[] = [];
    index += 1;
    while (index < lines.length && !endPattern.test(lines[index])) {
      body.push(lines[index]);
      index += 1;
    }
    blocks.push({
      block: blocks.length + 1,
      file,
      line: begin + 2,
      source: body.join("\n").trim(),
      terminated: index < lines.length,
    });
  }
  return blocks;
};

const errorMessage = (cause: unknown): string => {
  const raw = cause instanceof Error ? cause.message : String(cause);
  return raw.replace(ansiSgrPattern, "").replace(/\s+/gu, " ").trim();
};

const diagnosticLine = (block: OrgMermaidBlock, message: string): number => {
  const match = /(?:line|line:)\s*(\d+)/iu.exec(message);
  return match ? block.line + Number(match[1]) - 1 : block.line;
};

export const validateOrgMermaidBlocks = async (
  blocks: readonly OrgMermaidBlock[],
  parse: MermaidParser,
): Promise<OrgMermaidDiagnostic[]> => {
  const diagnostics: OrgMermaidDiagnostic[] = [];
  for (const block of blocks) {
    if (!block.terminated) {
      diagnostics.push({
        code: "MERMAID-E002",
        file: block.file,
        block: block.block,
        line: block.line,
        message: "Mermaid Org source block is missing #+end_src",
      });
      continue;
    }
    try {
      await parse(block.source);
    } catch (cause) {
      const message = errorMessage(cause);
      diagnostics.push({
        code: "MERMAID-E001",
        file: block.file,
        block: block.block,
        line: diagnosticLine(block, message),
        message,
      });
    }
  }
  return diagnostics;
};

export const validateOrgMermaidRoots = async (
  roots: readonly string[],
  parse: MermaidParser,
  workspaceRoot = process.cwd(),
): Promise<{ blocks: number; diagnostics: OrgMermaidDiagnostic[]; files: number }> => {
  const blocks: OrgMermaidBlock[] = [];
  let files = 0;
  for (const root of roots) {
    const absoluteRoot = resolve(workspaceRoot, root);
    for (const file of await orgFiles(absoluteRoot)) {
      files += 1;
      const displayFile = `${root.replace(/\\/gu, "/").replace(/\/$/u, "")}/${file}`;
      blocks.push(
        ...extractOrgMermaidBlocks(
          await readFile(resolve(absoluteRoot, file), "utf8"),
          displayFile,
        ),
      );
    }
  }
  return {
    blocks: blocks.length,
    diagnostics: await validateOrgMermaidBlocks(blocks, parse),
    files,
  };
};

export const formatOrgMermaidDiagnostic = (diagnostic: OrgMermaidDiagnostic): string =>
  `${diagnostic.code} ${diagnostic.file}:${diagnostic.line} block=${diagnostic.block} ${diagnostic.message}`;
