import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

import type { Browser, Page } from "@playwright/test";

export type StaticMediaFinding = {
  block: number;
  code: "RENDER-MERMAID-E001" | "RENDER-TYPST-E001";
  message: string;
};

export type StaticMediaInspection = {
  findings: StaticMediaFinding[];
  mermaidBlocks: number;
  previews: number;
  typstBlocks: number;
};

/** Inspect browser-serialized HTML without reparsing SVG through Happy DOM. */
export const inspectStaticMediaHtml = (html: string): StaticMediaInspection => {
  const variants = ["latte", "frappe", "macchiato", "mocha"];
  const preBlocks = [...html.matchAll(/<pre\b[^>]*>[\s\S]*?<\/pre>/gu)].map((match) => match[0]);
  const mermaidBlocks = preBlocks.filter((block) =>
    /\b(?:src-mermaid|language-mermaid)\b/u.test(block),
  ).length;
  const typstBlocks = preBlocks.filter((block) =>
    /\b(?:src-typst|src-typ|language-typst)\b/u.test(block),
  ).length;
  const mermaidTemplates = [
    ...html.matchAll(
      /<template\b[^>]*\bdata-org-mermaid-static-preview="([^"]+)"[^>]*>([\s\S]*?)<\/template>/gu,
    ),
  ];
  const typstTemplates = [
    ...html.matchAll(
      /<template\b[^>]*\bdata-org-typst-static-preview="([^"]+)"[^>]*>([\s\S]*?)<\/template>/gu,
    ),
  ];
  const hasGraphics = (svg: string): boolean => {
    const body = /<svg\b[^>]*>([\s\S]*?)<\/svg>/u.exec(svg)?.[1];
    return Boolean(
      body &&
      /<(?:path|use|rect|circle|line|polyline|polygon|ellipse|text|foreignObject|image)\b/u.test(
        body,
      ),
    );
  };
  const findings: StaticMediaFinding[] = [];
  let previews = 0;

  for (const variant of variants) {
    const matching = mermaidTemplates.filter((template) => template[1] === variant);
    if (matching.length !== mermaidBlocks) {
      findings.push({
        block: 0,
        code: "RENDER-MERMAID-E001",
        message: `${variant} preview count ${matching.length} does not match ${mermaidBlocks} source blocks`,
      });
    }
    for (const [index, template] of matching.entries()) {
      if (!hasGraphics(template[2])) {
        findings.push({
          block: index + 1,
          code: "RENDER-MERMAID-E001",
          message: `${variant} preview has no SVG graphics`,
        });
      } else {
        previews += 1;
      }
    }
  }
  const readyTypst = typstTemplates.filter((template) => template[1] === "ready");
  if (readyTypst.length !== typstBlocks) {
    findings.push({
      block: 0,
      code: "RENDER-TYPST-E001",
      message: `ready preview count ${readyTypst.length} does not match ${typstBlocks} source blocks`,
    });
  }
  for (const [index, template] of readyTypst.entries()) {
    if (!hasGraphics(template[2])) {
      findings.push({
        block: index + 1,
        code: "RENDER-TYPST-E001",
        message: "ready preview has no SVG graphics",
      });
    } else {
      previews += 1;
    }
  }

  return { findings, mermaidBlocks, previews, typstBlocks };
};

export const checkOrgStaticRendering = async (
  distRoot: string,
): Promise<{ files: number; mermaidBlocks: number; previews: number; typstBlocks: number }> => {
  const shardRoot = resolve(distRoot, "org-zhixing.sources");
  const files = (await readdir(shardRoot)).filter((file) => file.endsWith(".json")).sort();
  let browser: Browser | null = null;
  let page: Page | null = null;
  const diagnostics: string[] = [];
  let mermaidBlocks = 0;
  let previews = 0;
  let typstBlocks = 0;
  try {
    for (const file of files) {
      const shard = JSON.parse(await readFile(resolve(shardRoot, file), "utf8")) as {
        file?: string;
        html?: string;
      };
      if (typeof shard.html !== "string") {
        diagnostics.push(`RENDER-E000 ${shard.file ?? file}: source HTML is missing`);
        continue;
      }
      if (!/(?:src-mermaid|language-mermaid|src-typst|language-typst)/u.test(shard.html)) {
        continue;
      }
      if (!page) {
        const { chromium } = await import("@playwright/test");
        browser = await chromium.launch({ headless: true });
        page = await browser.newPage();
      }
      await page.setContent(`<!doctype html><html><body>${shard.html}</body></html>`, {
        waitUntil: "domcontentloaded",
      });
      const inspected = inspectStaticMediaHtml(await page.content());
      mermaidBlocks += inspected.mermaidBlocks;
      previews += inspected.previews;
      typstBlocks += inspected.typstBlocks;
      for (const finding of inspected.findings) {
        diagnostics.push(
          `${finding.code} ${shard.file ?? file} block=${finding.block} ${finding.message}`,
        );
      }
    }
  } finally {
    await browser?.close();
  }
  if (diagnostics.length > 0) {
    throw new Error(`org-static-render invalid=${diagnostics.length}\n${diagnostics.join("\n")}`);
  }
  return { files: files.length, mermaidBlocks, previews, typstBlocks };
};
