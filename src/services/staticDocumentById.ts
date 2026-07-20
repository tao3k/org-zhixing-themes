import {
  loadStaticDocumentData,
  type ContentShellData,
  type StaticDocumentData,
} from "./contentServices";

export class StaticDocumentNotFoundError extends Error {
  readonly documentId: string;

  constructor(documentId: string) {
    super(`ORG-ZHIXING-DOC-E001 unknown document "${documentId}"`);
    this.name = "StaticDocumentNotFoundError";
    this.documentId = documentId;
  }
}

export const loadStaticDocumentById = async (
  shell: ContentShellData,
  documentId: string,
): Promise<StaticDocumentData> => {
  const source = shell.staticSite?.sources.find((candidate) => candidate.id === documentId);
  if (source == null) {
    throw new StaticDocumentNotFoundError(documentId);
  }

  return loadStaticDocumentData(shell, {
    sourceFile: source.sourceFile,
    attachmentInventory: true,
    sectionIndex: true,
  });
};
