import { rewriteAttachmentLinks } from "./attachmentHtmlRewrite";
import { applyHtmlEmbedPolicy } from "./htmlEmbedPolicy";
import { type OrgizeDocumentView } from "./model";
import {
  augmentOrgHtmlMetadata,
  headingLevel,
  matchHeadingRecord,
  sectionRecords,
  sectionTitle,
  type SectionRecord,
} from "./orgHtmlMetadata";
import { enhanceOrgNativeAesthetics } from "./orgNativeAesthetics";

export type RenderedOrgSection = {
  bodyHtml: string;
  embedHtml: string;
  rangeStart: number;
  title: string;
};

export type RenderedOrgSectionContext = {
  articleHtml: string;
  document: OrgizeDocumentView;
  sourceFile?: string;
};

export const renderedOrgSections = (
  context: RenderedOrgSectionContext,
): ReadonlyMap<number, RenderedOrgSection> => {
  if (!context.articleHtml || typeof DOMParser === "undefined") {
    return new Map();
  }

  const parser = new DOMParser();
  const parsed = parser.parseFromString(context.articleHtml, "text/html");
  const root = parsed.querySelector("main") ?? parsed.body;
  const records = sectionRecords(context.document);
  const used = new Set<SectionRecord>();
  const rendered = new Map<number, RenderedOrgSection>();

  for (const heading of root.querySelectorAll<HTMLHeadingElement>("h1,h2,h3,h4,h5,h6")) {
    const record = matchHeadingRecord(heading, records, used);
    if (!record) {
      continue;
    }
    used.add(record);
    const ownSection = cloneOwnSection(heading, parsed);
    rewriteAttachmentLinks(ownSection, context.document, context.sourceFile);
    applyHtmlEmbedPolicy(ownSection);
    const embedHtml = extractEmbedHtml(ownSection);

    const section = cloneSection(heading, parsed);
    rewriteAttachmentLinks(section, context.document, context.sourceFile);
    applyHtmlEmbedPolicy(section);
    augmentOrgHtmlMetadata(section, context.document);
    enhanceOrgNativeAesthetics(section, context.document);
    section.querySelector("h1,h2,h3,h4,h5,h6")?.remove();
    rendered.set(record.source.rangeStart, {
      bodyHtml: section.innerHTML.trim(),
      embedHtml,
      rangeStart: record.source.rangeStart,
      title: sectionTitle(record),
    });
  }

  return rendered;
};

export const embedHtmlByRangeStart = (
  context: RenderedOrgSectionContext,
): ReadonlyMap<number, string> =>
  new Map(
    [...renderedOrgSections(context)]
      .filter(([, section]) => section.embedHtml.length > 0)
      .map(([rangeStart, section]) => [rangeStart, section.embedHtml]),
  );

const cloneSection = (heading: HTMLHeadingElement, parsed: Document): HTMLDivElement => {
  const level = headingLevel(heading);
  const container = parsed.createElement("div");
  container.append(heading.cloneNode(true));
  let next = heading.nextElementSibling;
  while (next && !(isHeading(next) && headingLevel(next) <= level)) {
    container.append(next.cloneNode(true));
    next = next.nextElementSibling;
  }
  return container;
};

const cloneOwnSection = (heading: HTMLHeadingElement, parsed: Document): HTMLDivElement => {
  const container = parsed.createElement("div");
  container.append(heading.cloneNode(true));
  let next = heading.nextElementSibling;
  while (next && !isHeading(next)) {
    container.append(next.cloneNode(true));
    next = next.nextElementSibling;
  }
  return container;
};

const isHeading = (element: Element): element is HTMLHeadingElement =>
  /^H[1-6]$/.test(element.tagName);

const extractEmbedHtml = (root: ParentNode): string => {
  const embeds = [
    ...root.querySelectorAll<HTMLElement>(".videoWrapper, iframe, video, audio"),
  ].filter((element) => !hasEmbedAncestor(element));
  return embeds.map((element) => element.outerHTML).join("");
};

const hasEmbedAncestor = (element: HTMLElement): boolean => {
  let parent = element.parentElement;
  while (parent) {
    if (
      parent.classList.contains("videoWrapper") ||
      parent.tagName === "IFRAME" ||
      parent.tagName === "VIDEO" ||
      parent.tagName === "AUDIO"
    ) {
      return true;
    }
    parent = parent.parentElement;
  }
  return false;
};
