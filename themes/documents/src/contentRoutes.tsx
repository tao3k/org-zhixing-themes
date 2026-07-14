import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import type { ContentShellData, StaticDocumentData } from "../../../src/services/contentServices";
import { loadStaticDocumentData } from "../../../src/services/contentServices";
import { defineReactSpaContentRoutes } from "../../../src/react/themeBinding";
import { DocumentsReader, type DocumentsDocumentData } from "./DocumentsReader";

const loadDocument = async (
  shell: ContentShellData,
  documentId: string,
): Promise<DocumentsDocumentData> => {
  const source = shell.staticSite?.sources.find((candidate) => candidate.id === documentId);
  if (!source) {
    throw new Error(`DOCUMENTS-E001 unknown document "${documentId}"`);
  }
  const document: StaticDocumentData = await loadStaticDocumentData(shell, {
    attachmentInventory: true,
    sectionIndex: true,
    sourceFile: source.sourceFile,
  });
  return { document, shell };
};

const renderHome = (shell: ContentShellData): ReactNode => (
  <section className="documents-index" aria-label="Documentation index">
    <p className="documents-node-id">TECHNICAL KNOWLEDGE BASE · ORG-ROAM</p>
    <h2>Read, understand, and navigate the system.</h2>
    <p className="documents-index-lead">
      Architecture, contracts, decisions, and operations live together as an indexed Org
      documentation corpus.
    </p>
    <div className="documents-index-stats" aria-label="Documentation statistics">
      <div>
        <strong>{shell.staticSite?.sources.length ?? 0}</strong>
        <span>Documents</span>
      </div>
      <div>
        <strong>{shell.siteConfig.contentRoot}</strong>
        <span>Source directory</span>
      </div>
      <div>
        <strong>Org</strong>
        <span>Source of truth</span>
      </div>
    </div>
    <h3>Start reading</h3>
    <ol className="documents-document-list">
      {(shell.staticSite?.sources ?? []).map((source) => (
        <li key={source.id}>
          <Link params={{ docId: source.id }} to="/$docId">
            <span>
              <strong>{source.orgTitle ?? source.name}</strong>
              <small>{source.sourceFile}</small>
            </span>
            <i aria-hidden="true">→</i>
          </Link>
        </li>
      ))}
    </ol>
  </section>
);

const renderDocument = (data: DocumentsDocumentData): ReactNode => <DocumentsReader {...data} />;

export const documentsContentRoutes = defineReactSpaContentRoutes({
  exclusiveContentRoutes: true,
  loadDocument,
  renderDocument,
  renderHome,
});
