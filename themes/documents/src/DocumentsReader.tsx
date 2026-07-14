import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { sectionRecords, sectionTitle } from "../../../src/orgHtmlMetadata";
import { RoutedHtmlSurface } from "../../../src/react/RoutedHtmlSurface";
import type { ContentShellData, StaticDocumentData } from "../../../src/services/contentServices";
import type { SectionRecord } from "../../../src/orgHtmlMetadata";
import { bindOrgSectionAnchors } from "../../../src/react/orgSectionAnchors";
import { LinkedNoteWorkspace, useLinkedNoteWorkspace } from "./LinkedNoteWorkspace";

export type DocumentsDocumentData = {
  document: StaticDocumentData;
  shell: ContentShellData;
};

type TocItem = {
  id: string;
  level: number;
  record: SectionRecord;
  title: string;
};

const tocItemsFor = (data: StaticDocumentData): TocItem[] =>
  sectionRecords(data.document)
    .filter((record) => sectionTitle(record).trim().length > 0)
    .map((record) => ({
      id: `section-${record.source.rangeStart}`,
      level: record.level,
      record,
      title: sectionTitle(record),
    }));

const breadcrumbParts = (sourceFile: string): string[] =>
  sourceFile
    .replace(/^docs\//, "")
    .replace(/\.org$/i, "")
    .split("/")
    .filter(Boolean);

export function DocumentsReader({ document: data, shell }: DocumentsDocumentData): ReactNode {
  const bodyRef = useRef<HTMLDivElement>(null);
  const toc = useMemo(() => tocItemsFor(data), [data]);
  const [activeSection, setActiveSection] = useState(toc[0]?.id ?? "");
  const sources = shell.staticSite?.sources ?? [];
  const currentIndex = sources.findIndex((source) => source.id === data.source.id);
  const previous = currentIndex > 0 ? sources[currentIndex - 1] : null;
  const next =
    currentIndex >= 0 && currentIndex < sources.length - 1 ? sources[currentIndex + 1] : null;
  const breadcrumbs = breadcrumbParts(data.source.sourceFile);
  const linkedNotes = useLinkedNoteWorkspace({
    currentDocumentId: data.source.id,
    shell,
  });

  useEffect(() => {
    const root = bodyRef.current;
    return root ? bindOrgSectionAnchors(root, toc, setActiveSection) : undefined;
  }, [toc]);

  return (
    <article className="documents-document-page">
      <div className="documents-reader">
        <main className="documents-reader-main">
          <nav className="documents-breadcrumbs" aria-label="Breadcrumb">
            <Link to="/">Docs</Link>
            {breadcrumbs.map((part, index) => (
              <span key={`${part}-${index}`}>
                <i aria-hidden="true">/</i>
                {part.replace(/^\d+(?:\.\d+)?[._-]?/, "").replace(/[._-]+/g, " ")}
              </span>
            ))}
          </nav>
          <header className="documents-document-header">
            <p className="documents-node-id">ORG NODE · {data.source.id}</p>
            <h1>{data.staticSource.orgTitle ?? data.source.name}</h1>
            <div className="documents-document-meta">
              <span>{data.source.sourceFile}</span>
              <span>{toc.length} sections</span>
              <span>{data.staticSource.sourceBytes.toLocaleString()} bytes</span>
            </div>
          </header>
          <div ref={bodyRef} className="documents-document-body">
            <RoutedHtmlSurface html={data.html} onInternalNavigation={linkedNotes.openLinkedNote} />
          </div>
          <nav className="documents-pagination" aria-label="Adjacent documentation">
            {previous ? (
              <Link
                params={{ docId: previous.id }}
                to="/$docId"
                className="documents-page-previous"
              >
                <small>Previous</small>
                <strong>← {previous.orgTitle ?? previous.name}</strong>
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link params={{ docId: next.id }} to="/$docId" className="documents-page-next">
                <small>Next</small>
                <strong>{next.orgTitle ?? next.name} →</strong>
              </Link>
            ) : null}
          </nav>
        </main>
        <aside className="documents-context-rail" aria-label="Document context">
          <nav id="docs-page-toc" className="documents-toc" aria-label="On this page">
            <h2>On this page</h2>
            {toc.length > 0 ? (
              <ol>
                {toc.map((item) => (
                  <li key={item.id} style={{ "--toc-depth": Math.max(0, item.level - 1) } as never}>
                    <a
                      href={`#${item.id}`}
                      aria-current={activeSection === item.id ? "location" : undefined}
                    >
                      {item.title}
                    </a>
                  </li>
                ))}
              </ol>
            ) : (
              <p>No sections indexed.</p>
            )}
          </nav>
          <section className="documents-node-context" aria-label="Org-roam node context">
            <h2>Org-roam context</h2>
            <dl>
              <div>
                <dt>Node</dt>
                <dd>{data.source.id}</dd>
              </div>
              <div>
                <dt>Corpus</dt>
                <dd>{sources.length} documents</dd>
              </div>
              <div>
                <dt>Source</dt>
                <dd>Org mode</dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>
      <LinkedNoteWorkspace workspace={linkedNotes} />
    </article>
  );
}
