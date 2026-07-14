import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { ContentShellData } from "../../../src/services/contentServices";
import type { StaticSourceSummary } from "../../../src/staticSite/model";

type DocumentGroup = {
  id: string;
  label: string;
  sources: StaticSourceSummary[];
};

const groupLabel = (value: string): string =>
  value
    .replace(/^\d+[._-]?/, "")
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

export const documentsNavigationGroups = (sources: StaticSourceSummary[]): DocumentGroup[] => {
  const groups = new Map<string, StaticSourceSummary[]>();
  for (const source of sources) {
    const relativePath = source.sourceFile.replace(/^docs\//, "");
    const [directory] = relativePath.split("/");
    const groupId = relativePath.includes("/") ? directory : "overview";
    groups.set(groupId, [...(groups.get(groupId) ?? []), source]);
  }
  return [...groups].map(([id, groupSources]) => ({
    id,
    label: id === "overview" ? "Overview" : groupLabel(id),
    sources: groupSources,
  }));
};

export function DocumentsNavigation({
  shell,
}: {
  shell?: ContentShellData;
  title: string;
}): ReactNode {
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const sources = shell?.staticSite?.sources ?? [];
  const groups = useMemo(() => documentsNavigationGroups(sources), [sources]);
  const normalizedQuery = query.trim().toLocaleLowerCase();

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent): void => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
      event.preventDefault();
      setMobileNavigationOpen(true);
      requestAnimationFrame(() => searchRef.current?.focus());
    };
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  return (
    <aside className="site-hero documents-sidebar" data-theme-slot="site-hero">
      <button
        type="button"
        className="documents-mobile-navigation-toggle"
        aria-expanded={mobileNavigationOpen}
        aria-controls="docs-navigation-panel"
        onClick={() => setMobileNavigationOpen((open) => !open)}
      >
        <span>Browse documentation</span>
        <span aria-hidden="true">{mobileNavigationOpen ? "−" : "+"}</span>
      </button>
      <div
        id="docs-navigation-panel"
        className="documents-navigation-panel"
        data-open={mobileNavigationOpen ? "true" : "false"}
      >
        <label className="documents-search" htmlFor="docs-navigation-search">
          <span aria-hidden="true">⌕</span>
          <input
            ref={searchRef}
            id="docs-navigation-search"
            type="search"
            placeholder="Search docs"
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
          />
          <kbd>/</kbd>
        </label>
        <nav className="documents-tree" aria-label="Documentation tree">
          {shell ? (
            <Link className="documents-tree-home" to="/" activeOptions={{ exact: true }}>
              <span aria-hidden="true">⌂</span>
              Documentation home
            </Link>
          ) : (
            <span className="documents-tree-home">
              <span aria-hidden="true">⌂</span>
              Documentation home
            </span>
          )}
          {groups.map((group) => {
            const visibleSources = group.sources.filter((source) => {
              if (!normalizedQuery) return true;
              return `${source.orgTitle ?? ""} ${source.name} ${source.sourceFile}`
                .toLocaleLowerCase()
                .includes(normalizedQuery);
            });
            if (visibleSources.length === 0) return null;
            return (
              <section className="documents-tree-group" key={group.id}>
                <h2>{group.label}</h2>
                <ul>
                  {visibleSources.map((source) => (
                    <li key={source.id}>
                      <Link params={{ docId: source.id }} to="/$docId">
                        <span>{source.orgTitle ?? source.name}</span>
                        <small>{source.file.replace(/\.org$/i, "")}</small>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
          {normalizedQuery &&
          groups.every((group) =>
            group.sources.every(
              (source) =>
                !`${source.orgTitle ?? ""} ${source.name} ${source.sourceFile}`
                  .toLocaleLowerCase()
                  .includes(normalizedQuery),
            ),
          ) ? (
            <p className="documents-search-empty">No matching documents.</p>
          ) : null}
        </nav>
      </div>
      <footer
        id="documents-workspace-dock"
        className="documents-workspace-dock"
        aria-label="Documentation workspace"
      />
    </aside>
  );
}
