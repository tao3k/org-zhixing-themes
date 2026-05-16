import type {
  OrgizeAgentCaptureApplicationPreconditionDto,
  OrgizeAgentCapturePlanResponseDto,
} from "orgize/dto";
import type { SourceItem } from "./config";

export type CaptureApplyPreconditionView = OrgizeAgentCaptureApplicationPreconditionDto & {
  owner: "user" | "host" | "runtime";
};

export type CaptureApplyPreview = {
  action: string;
  sourceFile: string;
  status: "reviewOnly" | "targetPending";
  lock: "git";
  preconditions: CaptureApplyPreconditionView[];
  patchPreview: string;
  note: string;
};

export const createCaptureApplyPreview = (
  response: OrgizeAgentCapturePlanResponseDto,
  source: SourceItem,
  sourceOrg: string,
): CaptureApplyPreview => {
  const { application, orgEntry } = response.plan;
  const sourceFile = application.target.sourceFile ?? source.sourceFile;
  const targetMatchesActiveSource = sourceFile === source.sourceFile;
  const status = targetMatchesActiveSource ? "reviewOnly" : "targetPending";
  return {
    action: application.action,
    sourceFile,
    status,
    lock: "git",
    preconditions: application.preconditions.map(preconditionView),
    patchPreview: targetMatchesActiveSource
      ? renderAppendPatchPreview(sourceFile, sourceOrg, orgEntry)
      : renderPendingTargetPreview(sourceFile, orgEntry),
    note:
      status === "reviewOnly"
        ? "Preview only. A host runtime must confirm, acquire the git write lock, resolve the target, and apply."
        : "Target source is not the active Org source. A host runtime must load and resolve it before previewing an exact patch.",
  };
};

const preconditionView = (
  precondition: OrgizeAgentCaptureApplicationPreconditionDto,
): CaptureApplyPreconditionView => ({
  ...precondition,
  owner: preconditionOwner(precondition.kind),
});

const preconditionOwner = (
  kind: OrgizeAgentCaptureApplicationPreconditionDto["kind"],
): CaptureApplyPreconditionView["owner"] => {
  switch (kind) {
    case "userConfirmation":
      return "user";
    case "writeLock":
    case "sourceFileResolution":
      return "host";
    case "datetreeResolution":
    case "outlinePathResolution":
    case "currentSectionResolution":
      return "runtime";
  }
};

const renderAppendPatchPreview = (
  sourceFile: string,
  sourceOrg: string,
  orgEntry: string,
): string => {
  const lineCount = countSourceLines(sourceOrg);
  const insertionLine = lineCount + 1;
  const entry = ensureTrailingNewline(orgEntry);
  const addedLines = entry.split("\n").slice(0, -1);
  return [
    `--- a/${sourceFile}`,
    `+++ b/${sourceFile}`,
    `@@ -${lineCount},0 +${insertionLine},${addedLines.length} @@`,
    ...addedLines.map((line) => `+${line}`),
  ].join("\n");
};

const renderPendingTargetPreview = (sourceFile: string, orgEntry: string): string =>
  [
    `target: ${sourceFile}`,
    "status: pending target source resolution",
    "",
    ensureTrailingNewline(orgEntry),
  ].join("\n");

const countSourceLines = (sourceOrg: string): number => {
  if (sourceOrg.length === 0) {
    return 0;
  }
  const lines = sourceOrg.split(/\r\n|\n|\r/);
  return lines.at(-1) === "" ? lines.length - 1 : lines.length;
};

const ensureTrailingNewline = (value: string): string =>
  value.endsWith("\n") ? value : `${value}\n`;
