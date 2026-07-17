const responsivePreviewPage = "#set page(width: auto, height: auto, margin: 8pt)";

export const prepareTypstPreviewSource = (source: string): string =>
  `${responsivePreviewPage}\n${source}`;
