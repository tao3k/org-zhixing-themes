import {
  blogArticleFromEvent,
  blogCacheKey,
  blogZenModeFromEvent,
  clearBlogCache,
  initialBlogReaderState,
  readerModeFor,
  syncBlogArticleSelection,
  type BlogReaderState,
} from "./blogState";
import {
  agendaViewRequest,
  loadSiteConfig,
  publicAssetUrl,
  resolveInitialAgendaMode,
  resolveInitialSource,
  resolveInitialView,
  showPerformanceFromUrl,
  sourceFromUserPath,
  type AgendaModeKey,
  type SiteConfig,
  type SourceItem,
} from "./config";
import type { AgendaPanelKey } from "./agendaTypes";
import {
  isAgendaMode,
  isAgendaPanel,
  resolveInitialAgendaPanel,
  resolveInitialAgendaRuleId,
} from "./agendaState";
import { createTabButtons } from "./appChrome";
import { bindAppDom, type AppDomNodes } from "./appDom";
import { createCaptureApplyPreview } from "./captureApplyPreview";
import { createAgentCaptureRequest } from "./captureModel";
import {
  createDocumentView,
  withAgendaView,
  withCapturePlan,
  withLint,
  type OrgizeDocumentView,
} from "./model";
import { OrgizeSession, type OrgizeSessionOptions } from "./orgizeClient";
import { renderAppShell } from "./appShell";
import { renderStats, renderView } from "./render";
import { renderSourceBlocks } from "./sourceBlocks";
import { writeAppUrlState } from "./urlState";
import type { ViewKey } from "./model";

export type OrgZhixingAppOptions = Pick<OrgizeSessionOptions, "createWorker">;
export type OrgZhixingAppHandle = { dispose: () => void };

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
  #dom!: AppDomNodes;
  #currentView: ViewKey = "blog";
  #agendaMode: AgendaModeKey = "classic";
  #agendaPanel: AgendaPanelKey = "trace";
  #agendaRuleId: string | null = null;
  #blog: BlogReaderState = initialBlogReaderState();
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
    this.#session = new OrgizeSession({ createWorker: options.createWorker });
  }

  dispose(): void {
    this.#abortController.abort();
    this.#session.dispose();
  }

  mount(): void {
    this.#root.innerHTML = renderAppShell();
    this.#dom = bindAppDom(this.#root);
    this.#bindEvents();
    this.#render();
    void this.#boot();
  }

  #bindEvents(): void {
    const listenerOptions = { signal: this.#abortController.signal };
    this.#dom.tabs.addEventListener(
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

    this.#dom.sourceSelect.addEventListener(
      "change",
      () => {
        if (!this.#siteConfig) {
          return;
        }
        const nextSource = sourceFromUserPath(this.#siteConfig, this.#dom.sourceSelect.value);
        this.#blog.articleRangeStart = null;
        this.#writeUrlState(nextSource.file);
        void this.#loadSource(nextSource);
      },
      listenerOptions,
    );

    this.#dom.sourceFeed.addEventListener(
      "click",
      (event) => {
        if (!this.#siteConfig) return;
        const target = (event.target as HTMLElement).closest<HTMLButtonElement>(
          "button[data-source-id]",
        );
        if (!target?.dataset.sourceId) return;
        const nextSource = sourceFromUserPath(this.#siteConfig, target.dataset.sourceId);
        this.#agendaRuleId = null;
        this.#blog.articleRangeStart = null;
        this.#writeUrlState(nextSource.file);
        void this.#loadSource(nextSource);
      },
      listenerOptions,
    );

    this.#dom.view.addEventListener(
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
        this.#agendaRuleId = null;
        this.#clearAgendaCache();
        this.#writeUrlState();
        this.#render();
      },
      listenerOptions,
    );

    this.#dom.view.addEventListener(
      "click",
      (event) => {
        const target = (event.target as HTMLElement).closest<HTMLButtonElement>(
          "button[data-agenda-panel]",
        );
        const panel = target?.dataset.agendaPanel;
        if (!isAgendaPanel(panel)) {
          return;
        }
        this.#agendaPanel = panel;
        this.#clearAgendaCache();
        this.#writeUrlState();
        this.#render();
      },
      listenerOptions,
    );

    this.#dom.view.addEventListener(
      "click",
      (event) => {
        const target = (event.target as HTMLElement).closest<HTMLElement>(
          "[data-agenda-rule-select]",
        );
        const ruleId = target?.dataset.agendaRuleSelect;
        if (!ruleId) {
          return;
        }
        this.#agendaRuleId = ruleId;
        this.#clearAgendaCache();
        this.#writeUrlState();
        this.#render();
        this.#scrollAgendaRuleIntoView(ruleId);
      },
      listenerOptions,
    );

    this.#dom.view.addEventListener(
      "click",
      (event) => {
        const rangeStart = blogArticleFromEvent(event);
        if (rangeStart === null) {
          return;
        }
        this.#blog.articleRangeStart = rangeStart;
        clearBlogCache(this.#viewCache);
        this.#writeUrlState();
        this.#render();
      },
      listenerOptions,
    );

    this.#dom.view.addEventListener(
      "click",
      (event) => {
        const zenMode = blogZenModeFromEvent(event);
        if (zenMode === null) {
          return;
        }
        this.#blog.zenMode = zenMode;
        clearBlogCache(this.#viewCache);
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
      this.#agendaPanel = resolveInitialAgendaPanel();
      this.#agendaRuleId = resolveInitialAgendaRuleId();
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
    this.#dom.sourceSelect.value = nextSource.file;
    this.#sourceOrg = "";
    this.#documentView = null;
    this.#renderedHtml = "";
    this.#timings = {};
    this.#viewCache.clear();
    this.#pendingMessage = "Loading Org source...";
    this.#articleMessage = "Loading Org source...";
    this.#render();

    this.#sourceOrg = await this.#loadOrgSource(nextSource.sourceFile);
    this.#pendingMessage = "Parsing view index...";
    this.#articleMessage = "Parsing Org source...";
    this.#render();

    const parsed = await this.#session.parseViewIndex(this.#sourceOrg, nextSource.sourceFile);
    if (version !== this.#documentVersion) {
      return;
    }
    this.#timings = { parseMs: parsed.durationMs };
    this.#documentView = createDocumentView(parsed.value.records);
    syncBlogArticleSelection(this.#documentView, this.#blog);
    this.#pendingMessage = "";
    this.#viewCache.clear();

    if (this.#siteConfig && !this.#siteConfig.behavior.lazyLint) {
      await this.#refreshLintIfNeeded();
    }
    if (this.#currentView === "agenda") {
      await this.#refreshAgendaIfNeeded();
    }
    if (this.#currentView === "capture") {
      await this.#refreshCaptureIfNeeded();
    }
    this.#updateStatus();
    this.#render();
    await this.#refreshArticleHtml(version);
    this.#updateStatus();
  }

  async #loadOrgSource(sourceFile: string): Promise<string> {
    const response = await fetch(publicAssetUrl(sourceFile), { cache: "no-store" });
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
    if (this.#currentView === "capture") {
      await this.#refreshCaptureIfNeeded();
    }
    this.#updateStatus();
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

  async #refreshCaptureIfNeeded(): Promise<void> {
    if (this.#documentView?.capturePlan || !this.#documentView || !this.#sourceItem) {
      return;
    }
    const version = this.#documentVersion;
    const request = createAgentCaptureRequest(this.#documentView, this.#sourceItem);
    this.#pendingMessage = "Projecting Agent capture plan...";
    this.#render();
    const capture = await this.#session.capturePlan(request);
    if (version !== this.#documentVersion) {
      return;
    }
    this.#timings = { ...this.#timings, captureMs: capture.durationMs };
    if (this.#documentView) {
      this.#documentView = withCapturePlan(
        this.#documentView,
        capture.value,
        request,
        createCaptureApplyPreview(capture.value, this.#sourceItem, this.#sourceOrg),
      );
    }
    this.#viewCache.delete("capture");
    this.#pendingMessage = "";
  }

  async #refreshArticleHtml(version: number): Promise<void> {
    if (this.#renderedHtml) {
      return;
    }
    this.#articleMessage = "Rendering article...";
    const html = await this.#session.renderTimed("html");
    if (version !== this.#documentVersion) {
      return;
    }
    this.#timings = { ...this.#timings, htmlMs: html.durationMs };
    this.#renderedHtml = html.value;
    this.#articleMessage = "";
    clearBlogCache(this.#viewCache);
    if (this.#currentView === "blog") {
      this.#render();
    }
  }

  #render(): void {
    this.#root.dataset.view = this.#currentView;
    this.#root.dataset.readerMode = readerModeFor(this.#currentView, this.#blog);
    if (this.#pendingMessage || !this.#documentView) {
      this.#dom.view.innerHTML = renderView({
        view: this.#currentView,
        document: this.#documentView,
        pendingMessage: this.#pendingMessage,
      });
      return;
    }
    const cacheKey = this.#viewCacheKey();
    let html = this.#viewCache.get(cacheKey);
    if (!html) {
      html = renderView({
        view: this.#currentView,
        document: this.#documentView,
        articleHtml: this.#renderedHtml,
        articleMessage: this.#articleMessage,
        blogArticleRangeStart: this.#blog.articleRangeStart,
        blogZenMode: this.#blog.zenMode,
        agendaMode: this.#agendaMode,
        agendaPanel: this.#agendaPanel,
        agendaRuleId: this.#agendaRuleId,
      });
      this.#viewCache.set(cacheKey, html);
    }
    this.#dom.view.innerHTML = html;
  }

  #viewCacheKey(): string {
    if (this.#currentView === "blog") {
      return blogCacheKey(this.#blog);
    }
    return this.#currentView === "agenda"
      ? `${this.#currentView}:${this.#agendaMode}:${this.#agendaPanel}:${this.#agendaRuleId ?? ""}`
      : this.#currentView;
  }

  #clearAgendaCache(): void {
    for (const key of this.#viewCache.keys()) {
      if (key === "agenda" || key.startsWith("agenda:")) {
        this.#viewCache.delete(key);
      }
    }
  }

  #updateStatus(): void {
    this.#dom.status.value = renderStats(this.#documentView, this.#timings, this.#showPerformance);
  }

  #configureChrome(config: SiteConfig): void {
    document.documentElement.lang = config.locale;
    document.title = config.title;
    this.#dom.siteTitle.textContent = config.title;
    this.#renderSourceOptions(config);
    this.#renderTabs(config);
  }

  #renderSourceOptions(config: SiteConfig): void {
    const selected = this.#sourceItem?.file;
    const { active, blocks, options } = renderSourceBlocks(config, selected, this.#sourceItem);
    this.#dom.sourceSelect.replaceChildren(...options);
    this.#dom.sourceFeed.replaceChildren(...blocks);
    this.#dom.activeSourceTitle.textContent = active?.name ?? config.title;
    this.#dom.activeSourcePath.textContent = active
      ? `${active.file} / blog source`
      : "No Org source";
  }

  #renderTabs(config: SiteConfig): void {
    this.#dom.tabs.replaceChildren(...createTabButtons(config, this.#currentView));
  }

  #updateActiveTab(): void {
    for (const button of this.#dom.tabs.querySelectorAll("button")) {
      button.classList.toggle("active", button.dataset.view === this.#currentView);
    }
  }

  #writeUrlState(nextSource = this.#sourceItem?.file): void {
    writeAppUrlState({
      source: nextSource,
      view: this.#currentView,
      agendaMode: this.#agendaMode,
      agendaPanel: this.#agendaPanel,
      agendaRuleId: this.#agendaRuleId,
      blog: this.#blog,
    });
  }

  #scrollAgendaRuleIntoView(ruleId: string): void {
    requestAnimationFrame(() => {
      const target = this.#dom.view.querySelector<HTMLElement>(
        `[data-agenda-group-rule="${CSS.escape(ruleId)}"]`,
      );
      target?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  #reportError(error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    this.#dom.status.value = "WASM worker failed";
    this.#dom.view.innerHTML = `<div class="error">${message}</div>`;
  }
}
