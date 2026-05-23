import { afterEach, describe, expect, it, vi } from "vitest";
import type { AppDomNodes } from "../src/appDom";
import { bindBlogZenProgress } from "../src/blogZenProgress";

describe("Blog Zen progress", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
  });

  it("updates the Zen reading progress from document scroll state", () => {
    installAnimationFrameStub();
    const dom = mountZenProgressDom();
    setDocumentScroll({ clientHeight: 500, scrollHeight: 1000, scrollTop: 250 });
    const controller = new AbortController();

    bindBlogZenProgress(dom, controller.signal);

    expect(progressBar(dom)?.style.getPropertyValue("--blog-zen-progress")).toBe("50%");

    setDocumentScroll({ clientHeight: 500, scrollHeight: 1000, scrollTop: 500 });
    window.dispatchEvent(new Event("scroll"));

    expect(progressBar(dom)?.style.getPropertyValue("--blog-zen-progress")).toBe("100%");
    controller.abort();
  });

  it("observes Zen reader rerenders without adding reader chrome", async () => {
    installAnimationFrameStub();
    const dom = mountZenProgressDom(false);
    setDocumentScroll({ clientHeight: 600, scrollHeight: 900, scrollTop: 150 });
    const controller = new AbortController();

    bindBlogZenProgress(dom, controller.signal);
    dom.view.innerHTML = `<div class="blog-zen-progress" data-blog-zen-progress><span></span></div>`;

    await vi.waitFor(() =>
      expect(progressBar(dom)?.style.getPropertyValue("--blog-zen-progress")).toBe("50%"),
    );
    expect(dom.view.querySelector(".zen-toolbar")).toBeNull();
    controller.abort();
  });
});

const installAnimationFrameStub = (): void => {
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    callback(0);
    return 1;
  });
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
};

const setDocumentScroll = ({
  clientHeight,
  scrollHeight,
  scrollTop,
}: {
  clientHeight: number;
  scrollHeight: number;
  scrollTop: number;
}): void => {
  Object.defineProperty(document.documentElement, "clientHeight", {
    configurable: true,
    value: clientHeight,
  });
  Object.defineProperty(document.documentElement, "scrollHeight", {
    configurable: true,
    value: scrollHeight,
  });
  Object.defineProperty(document.documentElement, "scrollTop", {
    configurable: true,
    value: scrollTop,
  });
};

const mountZenProgressDom = (withProgress = true): AppDomNodes => {
  document.body.innerHTML = `
    <div id="view">
      ${
        withProgress
          ? `<div class="blog-zen-progress" data-blog-zen-progress><span></span></div>`
          : ""
      }
    </div>
  `;
  return {
    view: document.querySelector<HTMLDivElement>("#view") as HTMLDivElement,
  };
};

const progressBar = (dom: AppDomNodes): HTMLElement | null =>
  dom.view.querySelector<HTMLElement>("[data-blog-zen-progress]");
