import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import type { ContentShellData } from "../services/contentServices";
import { lifeFacetFor, routePathForView } from "./routeViewHelpers";

export function ShellChrome({
  children,
  readerMode,
  shell,
}: {
  children: ReactNode;
  readerMode: "library" | "zen";
  shell: ContentShellData;
}): ReactNode {
  return (
    <main className={`shell${readerMode === "zen" ? " shell--zen" : ""}`}>
      {readerMode === "library" ? <SiteHeader shell={shell} /> : null}
      {readerMode === "library" ? <SiteHero title={shell.siteConfig.title} /> : null}
      <section className="viewer-pane">{children}</section>
      {readerMode === "library" ? <RuntimeState shell={shell} /> : null}
    </main>
  );
}

function SiteHeader({ shell }: { shell: ContentShellData }): ReactNode {
  return (
    <header className="site-header">
      <Link className="site-brand" to="/blogs" aria-label="Zhixing home">
        <span>知行合一</span>
        <small>Zhixing</small>
      </Link>
      <nav id="tabs" className="site-nav" aria-label="Life archive navigation">
        {shell.siteConfig.menu.map((item) => (
          <Link
            key={item.view}
            to={routePathForView(item.view)}
            className="site-nav-item"
            activeProps={{ className: "site-nav-item active" }}
          >
            <span>{item.name}</span>
            <small>{lifeFacetFor(item.view)}</small>
          </Link>
        ))}
      </nav>
      <output id="status" className="site-status">
        {shell.staticSite ? "static site-wide" : "live source"}
      </output>
    </header>
  );
}

function SiteHero({ title }: { title: string }): ReactNode {
  return (
    <section className="site-hero">
      <div className="hero-copy">
        <p className="eyebrow">Personal digital garden</p>
        <h1 id="site-title">{title}</h1>
        <p>把写作、札记、事件与行动议程放回同一个 Org 源头，让知识进入每天的实践。</p>
      </div>
    </section>
  );
}

function RuntimeState({ shell }: { shell: ContentShellData }): ReactNode {
  return (
    <div className="runtime-state" aria-hidden="true">
      <strong id="active-source-title">{shell.initialSource.name}</strong>
      <small id="active-source-path">{shell.initialSource.file} / blog source</small>
    </div>
  );
}
