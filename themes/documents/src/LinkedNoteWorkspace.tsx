import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { RoutedHtmlInternalNavigation } from "../../../src/react/RoutedHtmlSurface";
import { RoutedHtmlSurface } from "../../../src/react/RoutedHtmlSurface";
import {
  loadStaticDocumentData,
  type ContentShellData,
} from "../../../src/services/contentServices";

export type LinkedNote = {
  collapsed: boolean;
  html: string;
  id: string;
  pinned: boolean;
  sourceFile: string;
  title: string;
};

export const linkedDocumentId = (
  target: string,
  documentIds: ReadonlySet<string>,
): string | null => {
  const pathname = target.split(/[?#]/, 1)[0] ?? "";
  const [candidate, extra] = pathname.replace(/^\/+|\/+$/g, "").split("/");
  if (!candidate || extra || !documentIds.has(candidate)) return null;
  return candidate;
};

const keepWorkspaceBounded = (notes: LinkedNote[]): LinkedNote[] => {
  const pinned = notes.filter((note) => note.pinned);
  const transient = notes.filter((note) => !note.pinned).slice(-3);
  return [...pinned, ...transient];
};

export const openLinkedNoteState = (
  notes: LinkedNote[],
  opened: Omit<LinkedNote, "collapsed" | "pinned">,
): LinkedNote[] => {
  const existing = notes.find((note) => note.id === opened.id);
  const collapsed = notes.map((note) =>
    note.pinned || note.id === opened.id ? note : { ...note, collapsed: true },
  );
  return keepWorkspaceBounded([
    ...collapsed.filter((note) => note.id !== opened.id),
    {
      ...opened,
      collapsed: false,
      pinned: existing?.pinned ?? false,
    },
  ]);
};

export const linkedNotesStayExpanded = (notes: LinkedNote[]): boolean =>
  notes.some((note) => note.pinned);

export function useLinkedNoteWorkspace({
  currentDocumentId,
  shell,
}: {
  currentDocumentId: string;
  shell: ContentShellData;
}) {
  const [notes, setNotes] = useState<LinkedNote[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sources = useMemo(() => shell.staticSite?.sources ?? [], [shell.staticSite?.sources]);
  const documentIds = useMemo(() => new Set(sources.map((source) => source.id)), [sources]);

  useEffect(() => {
    setNotes((current) => {
      if (!linkedNotesStayExpanded(current)) setExpanded(false);
      return current.map((note) => (note.pinned ? note : { ...note, collapsed: true }));
    });
  }, [currentDocumentId]);

  useEffect(() => {
    const collapseTransientNote = (event: KeyboardEvent): void => {
      if (event.key !== "Escape") return;
      setNotes((current) => {
        setExpanded(linkedNotesStayExpanded(current));
        return current.map((note) => (note.pinned ? note : { ...note, collapsed: true }));
      });
    };
    window.addEventListener("keydown", collapseTransientNote);
    return () => window.removeEventListener("keydown", collapseTransientNote);
  }, []);

  const openLinkedNote = useCallback(
    ({ target }: RoutedHtmlInternalNavigation): boolean => {
      const documentId = linkedDocumentId(target, documentIds);
      if (!documentId || documentId === currentDocumentId) return false;
      const source = sources.find((candidate) => candidate.id === documentId);
      if (!source) return false;

      setError(null);
      setLoading(documentId);
      setExpanded(true);
      void loadStaticDocumentData(shell, {
        attachmentInventory: false,
        sectionIndex: false,
        sourceFile: source.sourceFile,
      })
        .then((data) => {
          setNotes((current) =>
            openLinkedNoteState(current, {
              html: data.html,
              id: documentId,
              sourceFile: data.source.sourceFile,
              title: data.staticSource.orgTitle ?? data.source.name,
            }),
          );
        })
        .catch(() => setError(`Unable to load ${source.orgTitle ?? source.name}.`))
        .finally(() => setLoading((value) => (value === documentId ? null : value)));
      return true;
    },
    [currentDocumentId, documentIds, shell, sources],
  );

  return {
    error,
    loading,
    notes,
    openLinkedNote,
    expanded,
    hasPinnedNotes: linkedNotesStayExpanded(notes),
    close: (id: string) => setNotes((current) => current.filter((note) => note.id !== id)),
    hide: () => setExpanded(false),
    reveal: () => setExpanded(true),
    toggleExpanded: () =>
      setExpanded((current) => (current ? linkedNotesStayExpanded(notes) : true)),
    toggleCollapsed: (id: string) =>
      setNotes((current) =>
        current.map((note) => (note.id === id ? { ...note, collapsed: !note.collapsed } : note)),
      ),
    togglePinned: (id: string) => {
      setExpanded(true);
      setNotes((current) =>
        current.map((note) => (note.id === id ? { ...note, pinned: !note.pinned } : note)),
      );
    },
  };
}

export function LinkedNoteWorkspace({
  workspace,
}: {
  workspace: ReturnType<typeof useLinkedNoteWorkspace>;
}): ReactNode {
  const collapseTimer = useRef<number | null>(null);
  const cancelScheduledCollapse = (): void => {
    if (collapseTimer.current === null) return;
    window.clearTimeout(collapseTimer.current);
    collapseTimer.current = null;
  };
  const scheduleCollapse = (): void => {
    cancelScheduledCollapse();
    if (workspace.hasPinnedNotes) return;
    collapseTimer.current = window.setTimeout(workspace.hide, 260);
  };
  useEffect(() => {
    cancelScheduledCollapse();
    if (workspace.expanded && !workspace.hasPinnedNotes) {
      collapseTimer.current = window.setTimeout(workspace.hide, 1800);
    }
    return cancelScheduledCollapse;
  }, [workspace.expanded, workspace.hasPinnedNotes, workspace.notes.length]);
  if (workspace.notes.length === 0 && !workspace.loading) return null;
  return (
    <aside
      className="documents-linked-workspace"
      data-expanded={workspace.expanded ? "true" : "false"}
      aria-label="Linked notes workspace"
      onFocusCapture={() => {
        cancelScheduledCollapse();
        workspace.reveal();
      }}
      onPointerEnter={() => {
        cancelScheduledCollapse();
        workspace.reveal();
      }}
      onPointerLeave={scheduleCollapse}
    >
      <button
        type="button"
        className="documents-linked-workspace-toggle"
        aria-label={workspace.expanded ? "Collapse linked notes" : "Open linked notes"}
        aria-expanded={workspace.expanded}
        onClick={workspace.toggleExpanded}
      >
        <span aria-hidden="true">◫</span>
        <strong>Linked notes</strong>
        <small>{workspace.notes.length}</small>
      </button>
      <div className="documents-linked-workspace-content">
        {workspace.notes.map((note) => (
          <section
            className="documents-linked-note"
            data-collapsed={note.collapsed ? "true" : "false"}
            data-pinned={note.pinned ? "true" : "false"}
            key={note.id}
          >
            <header>
              <button
                type="button"
                className="documents-linked-note-title"
                onClick={() => workspace.toggleCollapsed(note.id)}
                aria-expanded={!note.collapsed}
              >
                <span>{note.title}</span>
                <small>{note.sourceFile}</small>
              </button>
              <button
                type="button"
                onClick={() => workspace.togglePinned(note.id)}
                aria-label={note.pinned ? "Unpin linked note" : "Pin linked note"}
                aria-pressed={note.pinned}
              >
                {note.pinned ? "●" : "○"}
              </button>
              <button
                type="button"
                onClick={() => workspace.close(note.id)}
                aria-label="Close linked note"
              >
                ×
              </button>
            </header>
            {note.collapsed ? null : <LinkedNoteBody note={note} workspace={workspace} />}
          </section>
        ))}
        {workspace.loading ? (
          <p className="documents-linked-note-loading" role="status">
            Loading linked note…
          </p>
        ) : null}
        {workspace.error ? (
          <p className="documents-linked-note-loading" role="alert">
            {workspace.error}
          </p>
        ) : null}
      </div>
    </aside>
  );
}

function LinkedNoteBody({
  note,
  workspace,
}: {
  note: LinkedNote;
  workspace: ReturnType<typeof useLinkedNoteWorkspace>;
}): ReactNode {
  return (
    <div className="documents-linked-note-body">
      <RoutedHtmlSurface html={note.html} onInternalNavigation={workspace.openLinkedNote} />
    </div>
  );
}
