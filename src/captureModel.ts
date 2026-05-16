import type {
  OrgizeAgentCaptureDateDto,
  OrgizeAgentCaptureRequestDto,
  OrgizeAgentCaptureTimestampDto,
  OrgizeViewIndexRecordDto,
} from "orgize/dto";
import type { SourceItem } from "./config";
import type { OrgizeDocumentView } from "./model";

export const createAgentCaptureRequest = (
  document: OrgizeDocumentView,
  source: SourceItem,
  now = new Date(),
): OrgizeAgentCaptureRequestDto => {
  const record = pickCaptureRecord(document.sectionIndex);
  const title = record ? `Capture: ${record.title}` : `Capture: ${source.name}`;
  const sourceUri = `file:${source.sourceFile}`;
  const rangeLabel = record ? `start:${record.rangeStart}` : "document";

  return {
    kind: record?.effectiveTags.includes("blog") ? "articleNote" : "memoryCandidate",
    title,
    body: captureBody(record, source),
    target: {
      kind: "datetree",
      sourceFile: source.sourceFile,
      date: captureDate(now),
      insertPosition: "append",
    },
    source: {
      kind: "article",
      actor: "agent",
      uri: sourceUri,
      label: source.name,
    },
    capturedAt: captureTimestamp(now),
    tags: ["agent_capture", "memory_candidate", sourceTag(source.id)],
    properties: [
      { key: "SOURCE_FILE", value: source.sourceFile },
      { key: "SOURCE_RANGE", value: rangeLabel },
      { key: "SOURCE_OUTLINE", value: record?.outline ?? source.name },
      { key: "AGENT_CONSUMER", value: "org-zhixing" },
    ],
    quote: record?.bodyPreview || null,
    links: record
      ? [
          {
            url: `${sourceUri}::${record.rangeStart}`,
            label: `${source.file}#${record.rangeStart}`,
          },
        ]
      : [{ url: sourceUri, label: source.file }],
    memoryPolicy: "candidate",
    requiresConfirmation: true,
  };
};

const pickCaptureRecord = (
  records: OrgizeViewIndexRecordDto[],
): OrgizeViewIndexRecordDto | undefined =>
  records.find((record) => record.effectiveTags.includes("blog")) ??
  records.find((record) => record.effectiveTags.includes("record")) ??
  records[0];

const captureBody = (record: OrgizeViewIndexRecordDto | undefined, source: SourceItem): string => {
  if (!record) {
    return `Agent capture candidate from ${source.name}.`;
  }
  return [
    `Agent capture candidate from ${source.name}.`,
    `Outline: ${record.outline}`,
    record.bodyPreview,
  ]
    .filter(Boolean)
    .join("\n\n");
};

const captureDate = (date: Date): OrgizeAgentCaptureDateDto => ({
  year: date.getFullYear(),
  month: date.getMonth() + 1,
  day: date.getDate(),
});

const captureTimestamp = (date: Date): OrgizeAgentCaptureTimestampDto => ({
  ...captureDate(date),
  hour: date.getHours(),
  minute: date.getMinutes(),
});

const sourceTag = (sourceId: string): string => {
  const normalized = sourceId
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return normalized ? `source_${normalized}` : "source_org";
};
