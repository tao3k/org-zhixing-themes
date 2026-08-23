import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { SlidersHorizontalIcon } from "@phosphor-icons/react/dist/csr/SlidersHorizontal";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/csr/MagnifyingGlass";
import { CornersOutIcon } from "@phosphor-icons/react/dist/csr/CornersOut";
import type { ReactSpaSlotProps } from "../../../src/react/themeBinding";
import { requestOrgSearch } from "../../../src/react/orgSearchEvents";

export function DocumentsControlCenter({
  activeVariantId,
  onEnterZen,
  onVariantChange,
  shell,
  theme,
}: ReactSpaSlotProps["theme-controls"]): ReactNode {
  const [open, setOpen] = useState(false);
  const [workspaceDock, setWorkspaceDock] = useState<HTMLElement | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const sources = shell.staticSite?.sources ?? [];

  useEffect(() => {
    setWorkspaceDock(document.getElementById("documents-workspace-dock"));
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent): void => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent): void => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const controls = (
    <div ref={rootRef} className="documents-control-center" data-open={open}>
      {open ? (
        <section className="documents-control-panel" aria-label="Reading controls">
          <header>
            <span>Reading workspace</span>
            <strong>{sources.length} indexed Org</strong>
          </header>
          <div className="documents-control-section">
            <div className="documents-control-variants" aria-label="Theme appearance">
              {(theme.variants ?? []).map((variant) => (
                <button
                  key={variant.id}
                  type="button"
                  aria-pressed={activeVariantId === variant.id}
                  data-theme-variant-option={variant.id}
                  onClick={() => onVariantChange(variant.id)}
                >
                  <span aria-hidden="true" />
                  {variant.label ?? variant.id}
                </button>
              ))}
            </div>
          </div>
          <div className="documents-control-actions">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                requestOrgSearch();
              }}
            >
              <span>
                <MagnifyingGlassIcon aria-hidden="true" />
                Search Org
              </span>
              <kbd>Command F</kbd>
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onEnterZen();
              }}
            >
              <span>
                <CornersOutIcon aria-hidden="true" />
                Enter Zen mode
              </span>
              <kbd>Command Z</kbd>
            </button>
          </div>
          <footer>
            <span className="documents-status-dot" aria-hidden="true" />
            {sources.length} source shards ready
          </footer>
        </section>
      ) : null}
      <button
        type="button"
        className="documents-control-trigger"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
      >
        <span aria-hidden="true">
          <SlidersHorizontalIcon weight="bold" />
        </span>
        <strong>Reading</strong>
        <small>{sources.length}</small>
      </button>
    </div>
  );
  return workspaceDock ? createPortal(controls, workspaceDock) : null;
}
