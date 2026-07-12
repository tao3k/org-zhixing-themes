import { Link, useLocation } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import type { ContentShellData } from "../services/contentServices";
import type { ZhixingTheme } from "../library";
import { renderReactSpaThemeSlot } from "./themeBinding";
import { NavigationItems } from "./NavigationItems";
import { ThemeVariantNavigation } from "./ThemeVariantNavigation";

const MobileNavigationDrawer = lazy(() => import("./MobileNavigationDrawer"));

export function ShellChrome({
  children,
  readerMode,
  shell,
  theme,
  activeVariantId,
  onVariantChange,
}: {
  activeVariantId: string;
  children: ReactNode;
  onVariantChange: (variantId: string) => void;
  readerMode: "library" | "zen";
  shell: ContentShellData;
  theme: ZhixingTheme;
}): ReactNode {
  return (
    <main
      className={`shell theme-surface theme-surface--${theme.name}${readerMode === "zen" ? " shell--zen" : ""}`}
      data-theme-surface={theme.name}
    >
      {readerMode === "library"
        ? renderReactSpaThemeSlot(theme, "site-header", { shell }, <SiteHeader shell={shell} />)
        : null}
      {readerMode === "library" ? (
        <ThemeVariantNavigation
          activeVariantId={activeVariantId}
          onVariantChange={onVariantChange}
          theme={theme}
        />
      ) : null}
      {readerMode === "library"
        ? renderReactSpaThemeSlot(
            theme,
            "site-hero",
            { title: shell.siteConfig.title },
            <SiteHero title={shell.siteConfig.title} />,
          )
        : null}
      <section className="viewer-pane">{children}</section>
      {readerMode === "library"
        ? renderReactSpaThemeSlot(theme, "runtime-state", { shell }, <RuntimeState shell={shell} />)
        : null}
    </main>
  );
}

function SiteHeader({ shell }: { shell: ContentShellData }): ReactNode {
  const location = useLocation();
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const mobileNavigationTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setMobileNavigationOpen(false), [location.pathname]);

  return (
    <header className="site-header">
      <Link className="site-brand" to="/blogs" aria-label="Zhixing home">
        <span>知行合一</span>
        <small>Zhixing</small>
      </Link>
      <nav id="tabs" className="site-nav site-nav--desktop" aria-label="Life archive navigation">
        <NavigationItems shell={shell} />
      </nav>
      <button
        ref={mobileNavigationTriggerRef}
        type="button"
        className="mobile-menu-trigger"
        aria-label="Open navigation"
        aria-haspopup="dialog"
        aria-expanded={mobileNavigationOpen}
        aria-controls="mobile-navigation-drawer"
        onClick={() => setMobileNavigationOpen(true)}
      >
        <span aria-hidden="true">☰</span>
        <span>Menu</span>
      </button>
      {mobileNavigationOpen ? (
        <Suspense fallback={null}>
          <MobileNavigationDrawer
            open
            onOpenChange={setMobileNavigationOpen}
            returnFocusRef={mobileNavigationTriggerRef}
            shell={shell}
          />
        </Suspense>
      ) : null}
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
