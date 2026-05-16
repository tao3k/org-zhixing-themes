import type { SiteConfig, SourceItem } from "./config";

export const renderSourceBlocks = (
  config: SiteConfig,
  selected: string | undefined,
  extraSource: SourceItem | null,
): {
  active: SourceItem | undefined;
  options: HTMLOptionElement[];
  blocks: HTMLButtonElement[];
} => {
  const sources = sourceList(config, extraSource);
  return {
    active: sources.find((source) => source.file === selected) ?? sources[0],
    options: sources.map((source) => sourceOption(source, source.file === selected)),
    blocks: sources.map((source) => sourceBlock(source, source.file === selected)),
  };
};

const sourceList = (config: SiteConfig, extraSource: SourceItem | null): SourceItem[] => {
  const sources = [...config.sources];
  if (extraSource && !sources.some((source) => source.file === extraSource.file)) {
    sources.unshift(extraSource);
  }
  return sources;
};

const sourceOption = (source: SourceItem, active: boolean): HTMLOptionElement => {
  const option = document.createElement("option");
  option.value = source.file;
  option.textContent = source.name;
  option.selected = active;
  return option;
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

const sourceText = <K extends keyof HTMLElementTagNameMap>(
  text: string,
  tag: K,
): HTMLElementTagNameMap[K] => {
  const element = document.createElement(tag);
  element.textContent = text;
  return element;
};
