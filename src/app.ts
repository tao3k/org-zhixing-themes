import {
  agendaViewRequest,
  loadSiteConfig,
  resolveInitialAgendaMode,
  resolveInitialSource,
  resolveInitialView,
  showPerformanceFromUrl,
  sourceFromUserPath,
  type AgendaModeKey,
  type SiteConfig,
  type SourceItem,
} from "./config";
import { createDocumentView, withAgendaView, withLint, type OrgizeDocumentView } from "./model";
import { OrgizeSession, type OrgizeSessionOptions } from "./orgizeClient";
import { renderStats, renderView } from "./render";
import type { ViewKey } from "./model";

export type OrgZhixingAppOptions = Pick<OrgizeSessionOptions, "createWorker">;

export type OrgZhixingAppHandle = {
  dispose: () => void;
};

export const mountOrgZhixingApp = (
  app: HTMLElement,
  options: OrgZhixingAppOptions,
): OrgZhixingAppHandle => {
  const runtime = new OrgZhixingApp(app, options);
  runtime.mount();
  return runtime;
};

class OrgZhixingApp implements OrgZhixingAppHandle {
  readonly #root: HTMLElement;
  readonly #session: OrgizeSession;
  #abortController = new AbortController();
  #articlePane!: HTMLDivElement;
  #statusOutput!: HTMLOutputElement;
  #titleHeading!: HTMLHeadingElement;
  #sourceSelector!: HTMLSelectElement;
  #tabsNav!: HTMLElement;
  #viewPane!: HTMLDivElement;
  #currentView: ViewKey = "blog";
  #agendaMode: AgendaModeKey = "focus";
  #siteConfig: SiteConfig | null = null;
  #sourceItem: SourceItem | null = null;
  #documentView: OrgizeDocumentView | null = null;
  #renderedHtml = "";
  #pendingMessage = "Loading Org parser...";
  #articleMessage = "Rendering article...";
  #documentVersion = 0;
  #sourceOrg = "";
  #showPerformance = true;
  #timings = {};
  #viewCache = new Map<string, string>();

  constructor(root: HTMLElement, options: OrgZhixingAppOptions) {
    this.#root = root;
    this.#session = new OrgizeSession({
      createWorker: options.createWorker,
    });
  }

  dispose(): void {
    this.#abortController.abort();
    this.#session.dispose();
  }

  mount(): void {
    this.#root.innerHTML = `
      <main class="shell">
        <section class="article-pane">
          <header>
            <div>
              <p class="eyebrow">Org Zhixing</p>
              <h1 id="site-title">Blog, records, and agenda from one Org source</h1>
            </div>
            <output id="status">Loading Org parser...</output>
          </header>
          <div id="article" class="article-surface"></div>
        </section>
        <section class="viewer-pane">
          <div class="config-bar">
            <label for="source-select">Source</label>
            <select id="source-select"></select>
          </div>
          <nav id="tabs" aria-label="Views"></nav>
          <div id="view"></div>
        </section>
      </main>
    `;

    this.#bindDom();
    this.#bindEvents();
    this.#render();
    this.#renderArticle();
    void this.#boot();
  }

  #bindDom(): void {
    const article = this.#root.querySelector<HTMLDivElement>("#article");
    const status = this.#root.querySelector<HTMLOutputElement>("#status");
    const siteTitle = this.#root.querySelector<HTMLHeadingElement>("#site-title");
    const sourceSelect = this.#root.querySelector<HTMLSelectElement>("#source-select");
    const tabs = this.#root.querySelector<HTMLElement>("#tabs");
    const view = this.#root.querySelector<HTMLDivElement>("#view");

    if (!article || !status || !siteTitle || !sourceSelect || !tabs || !view) {
      throw new Error("missing demo DOM nodes");
    }

    this.#articlePane = article;
    this.#statusOutput = status;
    this.#titleHeading = siteTitle;
    this.#sourceSelector = sourceSelect;
    this.#tabsNav = tabs;
    this.#viewPane = view;
  }

  #bindEvents(): void {
    const listenerOptions = { signal: this.#abortController.signal };
    this.#tabsNav.addEventListener(
      "click",
      (event) => {
        const target = (event.target as HTMLElement).closest<HTMLButtonElement>(
          "button[data-view]",
        );
        if (!target) {
          return;
        }
        this.#currentView = target.dataset.view as ViewKey;
        this.#updateActiveTab();
        this.#writeUrlState();
        void this.#refreshActiveProjection();
      },
      listenerOptions,
    );

    this.#sourceSelector.addEventListener(
      "change",
      () => {
        if (!this.#siteConfig) {
          return;
        }
        const nextSource = sourceFromUserPath(this.#siteConfig, this.#sourceSelector.value);
        this.#writeUrlState(nextSource.file);
        void this.#loadSource(nextSource);
      },
      listenerOptions,
    );

    this.#viewPane.addEventListener(
      "click",
      (event) => {
        const target = (event.target as HTMLElement).closest<HTMLButtonElement>(
          "button[data-agenda-mode]",
        );
        const mode = target?.dataset.agendaMode;
        if (!isAgendaMode(mode)) {
          return;
        }
        this.#agendaMode = mode;
        this.#clearAgendaCache();
        this.#writeUrlState();
        this.#render();
      },
      listenerOptions,
    );

    window.addEventListener("beforeunload", () => this.dispose(), listenerOptions);
  }

  async #boot(): Promise<void> {
    try {
      this.#siteConfig = await loadSiteConfig();
      this.#showPerformance = showPerformanceFromUrl(this.#siteConfig.behavior.showPerformance);
      this.#currentView = resolveInitialView(this.#siteConfig);
      this.#agendaMode = resolveInitialAgendaMode(this.#siteConfig);
      this.#configureChrome(this.#siteConfig);
      await this.#loadSource(resolveInitialSource(this.#siteConfig));
    } catch (error) {
      this.#reportError(error);
    }
  }

  async #loadSource(nextSource: SourceItem): Promise<void> {
    const version = ++this.#documentVersion;
    this.#sourceItem = nextSource;
    if (this.#siteConfig) {
      this.#renderSourceOptions(this.#siteConfig);
    }
    this.#sourceSelector.value = nextSource.file;
    this.#sourceOrg = "";
    this.#documentView = null;
    this.#renderedHtml = "";
    this.#timings = {};
    this.#viewCache.clear();
    this.#pendingMessage = "Loading Org source...";
    this.#articleMessage = "Loading Org source...";
    this.#render();
    this.#renderArticle();

    this.#sourceOrg = await this.#loadOrgSource(nextSource.sourceFile);
    this.#pendingMessage = "Parsing view index...";
    this.#articleMessage = "Parsing Org source...";
    this.#render();
    this.#renderArticle();

    const parsed = await this.#session.parseViewIndex(this.#sourceOrg, nextSource.sourceFile);
    if (version !== this.#documentVersion) {
      return;
    }
    this.#timings = { parseMs: parsed.durationMs };
    this.#documentView = createDocumentView(parsed.value.records);
    this.#pendingMessage = "";
    this.#viewCache.clear();

    if (this.#siteConfig && !this.#siteConfig.behavior.lazyLint) {
      await this.#refreshLintIfNeeded();
    }
    if (this.#currentView === "agenda") {
      await this.#refreshAgendaIfNeeded();
    }
    this.#statusOutput.value = renderStats(
      this.#documentView,
      this.#timings,
      this.#showPerformance,
    );
    this.#render();
    await this.#refreshArticleHtml(version);
    this.#statusOutput.value = renderStats(
      this.#documentView,
      this.#timings,
      this.#showPerformance,
    );
  }

  async #loadOrgSource(sourceFile: string): Promise<string> {
    const response = await fetch(`/${sourceFile}`);
    if (!response.ok) {
      throw new Error(`failed to load ${sourceFile}: HTTP ${response.status}`);
    }
    return response.text();
  }

  async #refreshActiveProjection(): Promise<void> {
    if (!this.#documentView) {
      this.#render();
      return;
    }
    if (this.#currentView === "diagnostics") {
      await this.#refreshLintIfNeeded();
    }
    if (this.#currentView === "agenda") {
      await this.#refreshAgendaIfNeeded();
    }
    this.#statusOutput.value = renderStats(
      this.#documentView,
      this.#timings,
      this.#showPerformance,
    );
    this.#render();
  }

  async #refreshLintIfNeeded(): Promise<void> {
    if (this.#documentView?.lint) {
      return;
    }
    const version = this.#documentVersion;
    this.#pendingMessage = "Running lint projection...";
    this.#render();
    const lint = await this.#session.lint();
    if (version !== this.#documentVersion) {
      return;
    }
    this.#timings = { ...this.#timings, lintMs: lint.durationMs };
    if (this.#documentView) {
      this.#documentView = withLint(this.#documentView, lint.value.findings);
    }
    this.#viewCache.delete("diagnostics");
    this.#pendingMessage = "";
  }

  async #refreshAgendaIfNeeded(): Promise<void> {
    if (this.#documentView?.agendaView || !this.#siteConfig) {
      return;
    }
    const version = this.#documentVersion;
    this.#pendingMessage = "Projecting agenda intelligence...";
    this.#render();
    const agenda = await this.#session.agendaView(agendaViewRequest(this.#siteConfig.agenda));
    if (version !== this.#documentVersion) {
      return;
    }
    this.#timings = { ...this.#timings, agendaMs: agenda.durationMs };
    if (this.#documentView) {
      this.#documentView = withAgendaView(
        this.#documentView,
        agenda.value,
        this.#siteConfig.agenda,
      );
    }
    this.#clearAgendaCache();
    this.#pendingMessage = "";
  }

  async #refreshArticleHtml(version: number): Promise<void> {
    if (this.#renderedHtml) {
      return;
    }
    this.#articleMessage = "Rendering article...";
    this.#renderArticle();
    const html = await this.#session.renderTimed("html");
    if (version !== this.#documentVersion) {
      return;
    }
    this.#timings = { ...this.#timings, htmlMs: html.durationMs };
    this.#renderedHtml = html.value;
    this.#articleMessage = "";
    this.#renderArticle();
  }

  #render(): void {
    if (this.#pendingMessage || !this.#documentView) {
      this.#viewPane.innerHTML = renderView(
        this.#currentView,
        this.#documentView,
        this.#pendingMessage,
      );
      return;
    }
    const cacheKey = this.#viewCacheKey();
    let html = this.#viewCache.get(cacheKey);
    if (!html) {
      html = renderView(this.#currentView, this.#documentView, "", this.#agendaMode);
      this.#viewCache.set(cacheKey, html);
    }
    this.#viewPane.innerHTML = html;
  }

  #viewCacheKey(): string {
    return this.#currentView === "agenda"
      ? `${this.#currentView}:${this.#agendaMode}`
      : this.#currentView;
  }

  #clearAgendaCache(): void {
    for (const key of this.#viewCache.keys()) {
      if (key === "agenda" || key.startsWith("agenda:")) {
        this.#viewCache.delete(key);
      }
    }
  }

  #renderArticle(): void {
    if (this.#articleMessage) {
      this.#articlePane.innerHTML = `<div class="empty">${this.#articleMessage}</div>`;
      return;
    }
    this.#articlePane.innerHTML = `<article class="rendered-html">${this.#renderedHtml}</article>`;
  }

  #configureChrome(config: SiteConfig): void {
    document.documentElement.lang = config.locale;
    document.title = config.title;
    this.#titleHeading.textContent = config.title;
    this.#renderSourceOptions(config);
    this.#renderTabs(config);
  }

  #renderSourceOptions(config: SiteConfig): void {
    const selected = this.#sourceItem?.file;
    const sources = [...config.sources];
    if (this.#sourceItem && !sources.some((source) => source.file === this.#sourceItem?.file)) {
      sources.unshift(this.#sourceItem);
    }
    const options = sources.map((source) => {
      const option = document.createElement("option");
      option.value = source.file;
      option.textContent = source.name;
      option.selected = source.file === selected;
      return option;
    });
    this.#sourceSelector.replaceChildren(...options);
  }

  #renderTabs(config: SiteConfig): void {
    const buttons = config.menu.map((item) => {
      const button = document.createElement("button");
      button.dataset.view = item.view;
      button.textContent = item.name;
      button.classList.toggle("active", item.view === this.#currentView);
      return button;
    });
    this.#tabsNav.replaceChildren(...buttons);
  }

  #updateActiveTab(): void {
    for (const button of this.#tabsNav.querySelectorAll("button")) {
      button.classList.toggle("active", button.dataset.view === this.#currentView);
    }
  }

  #writeUrlState(nextSource = this.#sourceItem?.file): void {
    const url = new URL(window.location.href);
    if (nextSource) {
      url.searchParams.set("source", nextSource);
    }
    url.searchParams.set("view", this.#currentView);
    if (this.#currentView === "agenda") {
      url.searchParams.set("agenda", this.#agendaMode);
    }
    window.history.replaceState(null, "", url);
  }

  #reportError(error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    this.#statusOutput.value = "WASM worker failed";
    this.#viewPane.innerHTML = `<div class="error">${message}</div>`;
    this.#articlePane.innerHTML = `<div class="error">${message}</div>`;
  }
}

const isAgendaMode = (value: unknown): value is AgendaModeKey =>
  value === "focus" || value === "pressure" || value === "flow";
