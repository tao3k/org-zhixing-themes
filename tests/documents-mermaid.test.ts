import { afterEach, describe, expect, it, vi } from "vitest";
import {
  findMermaidSourceBlocks,
  installMermaidDiagrams,
  prepareMermaidFigures,
} from "../src/react/mermaidDiagrams";

afterEach(() => {
  document.body.replaceChildren();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("Documents Mermaid projection", () => {
  it("recognizes Org and ecosystem Mermaid code-block conventions", () => {
    document.body.innerHTML = `
      <pre class="src src-mermaid">flowchart LR; A --&gt; B</pre>
      <pre><code class="language-mermaid">sequenceDiagram\nA-&gt;&gt;B: Hello</code></pre>
      <pre class="src src-typescript">const untouched = true</pre>
    `;

    expect(findMermaidSourceBlocks(document)).toHaveLength(2);
  });

  it("preserves source as an accessible fallback before the lazy renderer loads", () => {
    document.body.innerHTML = `<pre class="src src-mermaid">flowchart TD; A --&gt; B</pre>`;

    const [figure] = prepareMermaidFigures(document);

    expect(figure.dataset.mermaidState).toBe("pending");
    expect(figure.getAttribute("aria-busy")).toBe("true");
    expect(figure.querySelector("details")?.open).toBe(true);
    expect(figure.textContent).toContain("flowchart TD; A --> B");
  });

  it("renders a visible diagram through the injected lazy Mermaid boundary", async () => {
    vi.useFakeTimers();
    class VisibleObserver {
      readonly callback: IntersectionObserverCallback;
      constructor(callback: IntersectionObserverCallback) {
        this.callback = callback;
      }
      observe(target: Element): void {
        this.callback(
          [{ isIntersecting: true, target } as IntersectionObserverEntry],
          this as never,
        );
      }
      disconnect(): void {}
      unobserve(): void {}
    }
    vi.stubGlobal("IntersectionObserver", VisibleObserver);
    document.body.innerHTML = `<pre class="src src-mermaid">flowchart TD; A --&gt; B</pre>`;
    const initialize = vi.fn();
    const render = vi.fn().mockResolvedValue({ svg: '<svg aria-label="diagram"></svg>' });

    const stop = installMermaidDiagrams(document, async () => ({ initialize, render }) as never);
    await vi.runAllTimersAsync();
    await Promise.resolve();

    expect(initialize).toHaveBeenCalledWith(expect.objectContaining({ securityLevel: "strict" }));
    expect(render).toHaveBeenCalledOnce();
    expect(document.querySelector("figure")?.dataset.mermaidState).toBe("ready");
    expect(document.querySelector("svg")).not.toBeNull();
    expect(document.querySelector("details")?.open).toBe(false);
    stop();
  });

  it("queues an initially laid-out diagram without waiting for an observer callback", async () => {
    class PassiveObserver {
      observe(): void {}
      disconnect(): void {}
      unobserve(): void {}
    }
    vi.stubGlobal("IntersectionObserver", PassiveObserver);
    vi.spyOn(HTMLElement.prototype, "getClientRects").mockReturnValue([{}] as never);
    document.body.innerHTML = `<pre class="src src-mermaid">flowchart TD; A --&gt; B</pre>`;
    const render = vi.fn(async () => ({ svg: "<svg></svg>" }));

    const stop = installMermaidDiagrams(
      document,
      async () => ({ initialize: vi.fn(), render }) as never,
    );
    await vi.waitFor(() => expect(render).toHaveBeenCalledOnce());

    expect(document.querySelector("figure")?.dataset.mermaidState).toBe("ready");
    stop();
  });

  it("renders visible diagrams immediately and initializes Mermaid once per theme", async () => {
    class VisibleObserver {
      readonly callback: IntersectionObserverCallback;
      constructor(callback: IntersectionObserverCallback) {
        this.callback = callback;
      }
      observe(target: Element): void {
        this.callback(
          [{ isIntersecting: true, target } as IntersectionObserverEntry],
          this as never,
        );
      }
      disconnect(): void {}
      unobserve(): void {}
    }
    const idle = vi.fn();
    vi.stubGlobal("IntersectionObserver", VisibleObserver);
    vi.stubGlobal("requestIdleCallback", idle);
    document.body.innerHTML = `
      <pre class="src src-mermaid">flowchart TD; A --&gt; B</pre>
      <pre class="src src-mermaid">flowchart TD; B --&gt; C</pre>
    `;
    const initialize = vi.fn();
    const render = vi.fn(async () => ({ svg: "<svg></svg>" }));
    const api = { initialize, render } as never;

    const stop = installMermaidDiagrams(document, async () => api);
    await vi.waitFor(() => expect(render).toHaveBeenCalledTimes(2));

    expect(idle).not.toHaveBeenCalled();
    expect(initialize).toHaveBeenCalledOnce();
    expect(document.querySelectorAll('[data-mermaid-state="ready"]')).toHaveLength(2);
    stop();
  });

  it("defers an offscreen theme refresh until the diagram re-enters the viewport", async () => {
    class ControlledObserver {
      static instance: ControlledObserver | undefined;
      readonly observed = new Set<Element>();
      constructor(readonly callback: IntersectionObserverCallback) {
        ControlledObserver.instance = this;
      }
      observe(target: Element): void {
        this.observed.add(target);
      }
      disconnect(): void {}
      unobserve(target: Element): void {
        this.observed.delete(target);
      }
      reveal(target: Element): void {
        this.callback(
          [{ isIntersecting: true, target } as IntersectionObserverEntry],
          this as never,
        );
      }
    }
    vi.stubGlobal("IntersectionObserver", ControlledObserver);
    document.body.innerHTML = `<pre class="src src-mermaid">flowchart TD; A --&gt; B</pre>`;
    const render = vi.fn(async () => ({ svg: "<svg></svg>" }));
    const stop = installMermaidDiagrams(
      document,
      async () => ({ initialize: vi.fn(), render }) as never,
    );
    const figure = document.querySelector<HTMLElement>("figure.org-mermaid")!;
    ControlledObserver.instance?.reveal(figure);
    await vi.waitFor(() => expect(render).toHaveBeenCalledOnce());

    vi.spyOn(figure, "getBoundingClientRect").mockReturnValue({
      bottom: 10_100,
      height: 100,
      left: 0,
      right: 100,
      top: 10_000,
      width: 100,
      x: 0,
      y: 10_000,
      toJSON: () => ({}),
    });
    document.documentElement.dataset.themeVariant = "latte";
    await Promise.resolve();
    await Promise.resolve();

    expect(ControlledObserver.instance?.observed).toContain(figure);
    expect(render).toHaveBeenCalledOnce();
    ControlledObserver.instance?.reveal(figure);
    await vi.waitFor(() => expect(render).toHaveBeenCalledTimes(2));
    stop();
  });
});
