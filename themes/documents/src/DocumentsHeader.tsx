import type { ReactNode } from "react";
import type { ContentShellData } from "../../../src/services/contentServices";
import { requestOrgSearch } from "../../../src/react/orgSearchEvents";
import { ThemeScopedHomeLink } from "../../../src/react/themeBinding";

export function DocumentsHeader({ shell }: { shell: ContentShellData }): ReactNode {
  return (
    <header className="site-header documents-header" data-theme-slot="site-header">
      <ThemeScopedHomeLink className="site-brand documents-brand">
        <span aria-hidden="true">⌘</span>
        <strong>{shell.siteConfig.title}</strong>
        <small>Technical documentation</small>
      </ThemeScopedHomeLink>
      <nav className="documents-primary-nav" aria-label="Documentation navigation">
        <ThemeScopedHomeLink>Documentation index</ThemeScopedHomeLink>
      </nav>
      <button type="button" className="documents-command" onClick={requestOrgSearch}>
        <span>Search documentation</span>
        <kbd>Ctrl F</kbd>
      </button>
    </header>
  );
}
