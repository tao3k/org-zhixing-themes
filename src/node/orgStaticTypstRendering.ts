import { NodeCompiler } from "@myriaddreamin/typst-ts-node-compiler";
import { Window } from "happy-dom";

import { prepareTypstPreviewSource } from "../core/typstSource";
import { sanitizeTypstSvg } from "../core/typstSvg";
import { languageFromOrgCodeClasses } from "../orgCodeLanguage";

export type StaticTypstRenderer = (source: string) => Promise<string>;

const compiler = NodeCompiler.create();

const renderTypst: StaticTypstRenderer = async (source) => {
  try {
    return compiler.svg({ mainFileContent: prepareTypstPreviewSource(source) });
  } finally {
    compiler.evictCache(10);
  }
};

const isStaticTypstBlock = (block: HTMLElement): boolean => {
  const language = languageFromOrgCodeClasses([
    ...block.classList,
    ...(block.querySelector("code")?.classList ?? []),
  ]);
  if (language === "typst") return true;
  return (
    block
      .closest("figure.org-code-highlight")
      ?.querySelector(":scope > figcaption")
      ?.textContent?.trim()
      .toLowerCase() === "typst"
  );
};

/**
 * Compiles source known at build time so static readers never need the browser
 * compiler WASM. `currentColor` keeps the preview native to every theme.
 */
export const renderOrgStaticTypstDocument = async (
  document: Document,
  render: StaticTypstRenderer = renderTypst,
): Promise<void> => {
  const blocks = [...document.querySelectorAll("pre")] as unknown as HTMLElement[];
  const typstBlocks = blocks.filter(
    (block) =>
      isStaticTypstBlock(block) &&
      block.previousElementSibling?.matches("template[data-org-typst-static-preview='ready']") !==
        true,
  );

  for (const block of typstBlocks) {
    const template = document.createElement("template");
    template.dataset.orgTypstStaticPreview = "ready";
    template.innerHTML = sanitizeTypstSvg(await render(block.textContent ?? ""), "currentColor");
    block.before(template);
  }
};

export const renderOrgStaticTypstHtml = async (
  html: string,
  render: StaticTypstRenderer = renderTypst,
): Promise<string> => {
  const window = new Window();
  window.document.body.innerHTML = html;
  await renderOrgStaticTypstDocument(window.document as unknown as Document, render);
  return window.document.body.innerHTML;
};
