import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import type { ContentShellData } from "../../../src/services/contentServices";
import { requestOrgSearch } from "../../../src/react/orgSearchEvents";

export function DocumentsHeader({ shell }: { shell: ContentShellData }): ReactNode {
  return (
    <header className="site-header documents-header" data-theme-slot="site-header">
      <Link className="site-brand documents-brand" to="/" aria-label="Documentation home">
        <span aria-hidden="true">⌘</span>
        <strong>{shell.siteConfig.title}</strong>
        <small>Technical documentation</small>
      </Link>
      <nav className="documents-primary-nav" aria-label="Documentation navigation">
        <Link to="/">Documentation index</Link>
      </nav>
      <button type="button" className="documents-command" onClick={requestOrgSearch}>
        <span>Search documentation</span>
        <kbd>Ctrl F</kbd>
      </button>
    </header>
  );
}
