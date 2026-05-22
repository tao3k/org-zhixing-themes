import type { SiteConfig, SourceItem } from "./config";

const visibleSourceBlockLimit = 6;

export const renderSourceBlocks = (
  config: SiteConfig,
  selected: string | undefined,
  extraSource: SourceItem | null,
): {
  active: SourceItem | undefined;
  blocks: HTMLButtonElement[];
  sources: SourceItem[];
} => {
  const sources = sourceList(config, extraSource);
  const active = sources.find((source) => source.file === selected) ?? sources[0];
  const visibleSources = sourceFeedSources(sources, active);
  return {
    active,
    blocks: [
      ...visibleSources.map((source) => sourceBlock(source, source.file === selected)),
      ...sourceSummaryBlocks(sources.length, visibleSources.length),
    ],
    sources,
  };
};

const sourceList = (config: SiteConfig, extraSource: SourceItem | null): SourceItem[] => {
  const sources = [...config.sources];
  if (extraSource && !sources.some((source) => source.file === extraSource.file)) {
    sources.unshift(extraSource);
  }
  return sources;
};

const sourceFeedSources = (sources: SourceItem[], active: SourceItem | undefined): SourceItem[] => {
  if (sources.length <= visibleSourceBlockLimit) {
    return sources;
  }
  const visible = new Map<string, SourceItem>();
  const add = (source: SourceItem | undefined): void => {
    if (source) {
      visible.set(source.file, source);
    }
  };
  add(active);
  for (const source of sources) {
    if (visible.size >= visibleSourceBlockLimit) {
      break;
    }
    add(source);
  }
  return [...visible.values()];
};

const sourceBlock = (source: SourceItem, active: boolean): HTMLButtonElement => {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.sourceId = source.id;
  button.title = source.file;
  button.className = `source-block${active ? " active" : ""}`;
  button.append(sourceText(active ? "Current Org" : "Org source", "span"));
  button.append(sourceText(source.name, "strong"));
  button.append(sourceText(source.file, "small"));
  button.append(sourceText(active ? "Reading" : "Open", "em"));
  return button;
};

const sourceSummaryBlocks = (total: number, visible: number): HTMLButtonElement[] => {
  const hidden = total - visible;
  if (hidden <= 0) {
    return [];
  }
  const button = document.createElement("button");
  button.type = "button";
  button.disabled = true;
  button.className = "source-block source-block--summary";
  button.append(sourceText("Indexed", "span"));
  button.append(sourceText(`${hidden} more Org files`, "strong"));
  button.append(sourceText("Use the source picker", "small"));
  return [button];
};

const sourceText = <K extends keyof HTMLElementTagNameMap>(
  text: string,
  tag: K,
): HTMLElementTagNameMap[K] => {
  const element = document.createElement(tag);
  element.textContent = text;
  return element;
};
