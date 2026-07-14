export type OrgDocumentLinkSource = {
  file: string;
  id: string;
};

export declare const projectOrgDocumentLinks: (
  html: string,
  options: {
    currentFile: string;
    document: unknown;
    sources: OrgDocumentLinkSource[];
  },
) => string;
