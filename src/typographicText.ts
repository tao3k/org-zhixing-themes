import { LineBreaker } from "css-line-break";

type CssLineBreak = "auto" | "normal" | "strict";
type CssWordBreak = "break-all" | "break-word" | "keep-all" | "normal";

type SoftBreakTextOptions = {
  lineBreak?: CssLineBreak;
  maxSegmentLength?: number;
  wordBreak?: CssWordBreak;
};

const DEFAULT_MAX_SEGMENT_LENGTH = 24;
const SOFT_BREAK = "<wbr>";

export const renderSoftBreakText = (
  value: string | number,
  options: SoftBreakTextOptions = {},
): string => {
  const text = String(value);
  if (!text) {
    return "";
  }

  const chunks = lineBreakChunks(text, {
    lineBreak: options.lineBreak ?? "normal",
    wordBreak: "normal",
  }).flatMap((chunk) => splitLongChunk(chunk, options));

  return chunks.map(escapeHtml).join(SOFT_BREAK);
};

const splitLongChunk = (chunk: string, options: SoftBreakTextOptions): string[] => {
  const maxSegmentLength = options.maxSegmentLength ?? DEFAULT_MAX_SEGMENT_LENGTH;
  if (chunk.length <= maxSegmentLength) {
    return [chunk];
  }

  return lineBreakChunks(chunk, {
    lineBreak: options.lineBreak ?? "normal",
    wordBreak: options.wordBreak ?? "break-word",
  });
};

const lineBreakChunks = (
  text: string,
  options: { lineBreak: CssLineBreak; wordBreak: CssWordBreak },
): string[] => {
  const chunks: string[] = [];
  const breaker = LineBreaker(text, options);
  let next = breaker.next();
  while (!next.done) {
    chunks.push(next.value.slice());
    next = breaker.next();
  }
  return chunks.length > 0 ? chunks : [text];
};

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
