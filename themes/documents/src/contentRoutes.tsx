import type { ReactNode } from "react";
import type { ContentShellData, StaticDocumentData } from "../../../src/services/contentServices";
import { loadStaticDocumentData } from "../../../src/services/contentServices";
import { defineReactSpaContentRoutes, ThemeScopedDocumentLink } from "../../../src/react/themeBinding";
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

const renderHome = (shell: ContentShellData): ReactNode => {
  const featuredSources = pooFlowSources(shell);
  return (
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
      {featuredSources.length > 0 ? (
        <section className="documents-featured-documents" aria-label="POO Flow graph fixtures">
          <p className="documents-node-id">POO FLOW · INTERACTIVE GRAPH</p>
          <h3>Runtime-backed Scheme graph fixtures</h3>
          <p>
            These Org pages exercise the runtime-wasm workflow registry and render Scheme-owned
            workflows through the documents reader.
          </p>
          <ol className="documents-document-list documents-document-list--featured">
            {featuredSources.map((source) => (
              <li key={source.id}>
                <ThemeScopedDocumentLink documentId={source.id}>
                  <span>
                    <strong>{source.orgTitle ?? source.name}</strong>
                    <small>{source.sourceFile}</small>
                  </span>
                  <i aria-hidden="true">→</i>
                </ThemeScopedDocumentLink>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
      <h3>Start reading</h3>
      <ol className="documents-document-list">
        {(shell.staticSite?.sources ?? []).map((source) => (
          <li key={source.id}>
            <ThemeScopedDocumentLink documentId={source.id}>
              <span>
                <strong>{source.orgTitle ?? source.name}</strong>
                <small>{source.sourceFile}</small>
              </span>
              <i aria-hidden="true">→</i>
            </ThemeScopedDocumentLink>
          </li>
        ))}
      </ol>
    </section>
  );
};

const pooFlowSources = (shell: ContentShellData) =>
  (shell.staticSite?.sources ?? []).filter((source) =>
    /(?:^|[/._-])poo-flow(?:$|[/._-])/i.test(`${source.sourceFile} ${source.id}`),
  );

const renderDocument = (data: DocumentsDocumentData): ReactNode => <DocumentsReader {...data} />;

export const documentsContentRoutes = defineReactSpaContentRoutes({
  exclusiveContentRoutes: true,
  showSiteHeroOnContentRoutes: true,
  loadDocument,
  renderDocument,
  renderHome,
});
