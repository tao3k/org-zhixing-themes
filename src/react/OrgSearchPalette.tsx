import * as Dialog from "@radix-ui/react-dialog";
import { useNavigate } from "@tanstack/react-router";
import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { loadOrgSearchIndex, type OrgSearchIndex, type OrgSearchResult } from "../orgSearch";
import type { ContentShellData } from "../services/contentServices";
import { orgSearchStyleSheet } from "./orgSearchStyleSheet";

type OrgSearchPaletteProps = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  shell: ContentShellData;
};

export default function OrgSearchPalette(props: OrgSearchPaletteProps): ReactNode {
  return <OrgSearchPaletteView {...props} />;
}

function OrgSearchPaletteView({ onOpenChange, open, shell }: OrgSearchPaletteProps): ReactNode {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [index, setIndex] = useState<OrgSearchIndex | null>(null);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [activeIndex, setActiveIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isNavigating, startNavigation] = useTransition();

  useEffect(() => {
    if (!open || index) return;
    let active = true;
    void loadOrgSearchIndex(shell)
      .then((loaded) => {
        if (active) setIndex(loaded);
      })
      .catch(() => {
        if (active) setError("The Org search index could not be loaded.");
      });
    return () => {
      active = false;
    };
  }, [index, open, shell]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setActiveIndex(0);
    }
  }, [open]);

  const results = useMemo(
    () => (index && deferredQuery.trim().length > 0 ? index.search(deferredQuery) : []),
    [deferredQuery, index],
  );

  useEffect(() => setActiveIndex(0), [deferredQuery]);

  const openResult = (result: OrgSearchResult): void => {
    startNavigation(() => {
      onOpenChange(false);
      void navigate({ to: result.route } as never);
    });
  };

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => Math.min(results.length - 1, current + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(0, current - 1));
    } else if (event.key === "Enter" && results[activeIndex]) {
      event.preventDefault();
      openResult(results[activeIndex]);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <style>{orgSearchStyleSheet}</style>
        <Dialog.Overlay className="org-search-overlay" />
        <Dialog.Content
          className="org-search-palette"
          aria-describedby="org-search-description"
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            inputRef.current?.focus();
          }}
        >
          <Dialog.Title>Search Org knowledge</Dialog.Title>
          <Dialog.Description id="org-search-description">
            Search document titles, headings, text, paths, tags, and TODO states.
          </Dialog.Description>
          <label className="org-search-input">
            <span aria-hidden="true">⌕</span>
            <input
              ref={inputRef}
              type="search"
              value={query}
              placeholder="Search headings, tags, TODO, source paths…"
              onChange={(event) => setQuery(event.currentTarget.value)}
              onKeyDown={onInputKeyDown}
            />
            <kbd>Esc</kbd>
          </label>
          <div className="org-search-status" role="status">
            {!index && !error
              ? "Building the local Org index…"
              : deferredQuery !== query
                ? "Searching Org knowledge…"
                : query.trim().length === 0
                  ? `${index?.count ?? 0} indexed documents and sections`
                  : `${results.length} ranked results${isNavigating ? " · opening" : ""}`}
          </div>
          {error ? (
            <p className="org-search-error" role="alert">
              {error}
            </p>
          ) : null}
          <ol className="org-search-results" aria-label="Org search results">
            {results.map((result, resultIndex) => (
              <li key={result.id}>
                <button
                  type="button"
                  data-active={resultIndex === activeIndex ? "true" : "false"}
                  onClick={() => openResult(result)}
                  onPointerMove={() => setActiveIndex(resultIndex)}
                >
                  <span className="org-search-result-kind">
                    {result.kind === "section" ? "Section" : "Document"}
                  </span>
                  <strong>{result.title}</strong>
                  <small>{result.path}</small>
                  <p>{result.text.slice(0, 180)}</p>
                  <span className="org-search-result-fields">
                    {result.todo ? <i>{result.todo}</i> : null}
                    {result.tags ? <i>#{result.tags.replace(/\s+/g, " #")}</i> : null}
                    {result.matchedFields.map((field) => (
                      <i key={field}>{field}</i>
                    ))}
                  </span>
                </button>
              </li>
            ))}
          </ol>
          {index && query.trim() && results.length === 0 ? (
            <p className="org-search-empty">No matching Org knowledge.</p>
          ) : null}
          <footer>
            <span>↑↓ Select</span>
            <span>↵ Open</span>
            <span>Prefix + fuzzy ranking</span>
          </footer>
          <Dialog.Close className="org-search-close" aria-label="Close search">
            ×
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
