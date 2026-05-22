import {
  Virtualizer,
  elementScroll,
  measureElement,
  observeElementOffset,
  observeElementRect,
  type Rect,
  type VirtualizerOptions,
} from "@tanstack/virtual-core";
import type { AppDomNodes } from "./appDom";

const virtualListSelector = "[data-blog-virtual-list]";
const articleSelector = ":scope > article";
const rowGap = 0;

type VirtualListInstance = {
  cleanup: () => void;
  element: HTMLElement;
};

export const bindBlogVirtualList = (dom: AppDomNodes, signal: AbortSignal): void => {
  const instances = new Set<VirtualListInstance>();

  const cleanupDisconnected = (): void => {
    for (const instance of instances) {
      if (!instance.element.isConnected) {
        instance.cleanup();
        instances.delete(instance);
      }
    }
  };

  const enhance = (): void => {
    cleanupDisconnected();
    for (const list of dom.view.querySelectorAll<HTMLElement>(virtualListSelector)) {
      if (list.dataset.blogVirtualized) {
        continue;
      }
      instances.add(virtualizeBlogList(list));
    }
  };

  const observer = new MutationObserver(enhance);
  observer.observe(dom.view, { childList: true });
  signal.addEventListener(
    "abort",
    () => {
      observer.disconnect();
      for (const instance of instances) {
        instance.cleanup();
      }
      instances.clear();
    },
    { once: true },
  );
  enhance();
};

const virtualizeBlogList = (list: HTMLElement): VirtualListInstance => {
  const articleHtml = [...list.querySelectorAll<HTMLElement>(articleSelector)].map(
    (article) => article.outerHTML,
  );
  list.dataset.blogVirtualized = "true";
  list.classList.add("blog-index-list--virtual");
  const spacer = document.createElement("div");
  spacer.className = "blog-virtual-spacer";
  list.replaceChildren(spacer);

  let virtualizer: Virtualizer<HTMLElement, HTMLElement>;
  const render = (): void => {
    const virtualItems = virtualizer.getVirtualItems();
    spacer.style.height = `${virtualizer.getTotalSize()}px`;
    spacer.replaceChildren(
      ...virtualItems.map((item) => {
        const row = document.createElement("div");
        row.className = "blog-virtual-row";
        row.dataset.index = String(item.index);
        row.style.transform = `translateY(${item.start}px)`;
        row.innerHTML = articleHtml[item.index] ?? "";
        return row;
      }),
    );
    for (const row of spacer.querySelectorAll<HTMLElement>(".blog-virtual-row")) {
      virtualizer.measureElement(row);
    }
  };

  virtualizer = new Virtualizer<HTMLElement, HTMLElement>({
    count: articleHtml.length,
    getScrollElement: () => list,
    estimateSize: (index) => estimateRowSize(articleHtml[index] ?? ""),
    getItemKey: (index) => index,
    gap: rowGap,
    initialRect: {
      height: list.clientHeight || 640,
      width: list.clientWidth || 960,
    },
    overscan: 8,
    observeElementRect: observeBlogElementRect,
    observeElementOffset: observeBlogElementOffset,
    scrollToFn: elementScroll,
    measureElement,
    onChange: render,
  });

  const cleanupVirtualizer = virtualizer._didMount();
  virtualizer._willUpdate();
  render();

  return {
    element: list,
    cleanup: cleanupVirtualizer,
  };
};

const estimateRowSize = (html: string): number => {
  const previewCost = Math.min(52, Math.floor(html.length / 260) * 13);
  return 74 + previewCost;
};

const observeBlogElementRect: VirtualizerOptions<HTMLElement, HTMLElement>["observeElementRect"] = (
  instance,
  callback,
) => {
  const emitRect = (rect?: Rect): void => {
    const element = instance.scrollElement;
    callback({
      height: rect?.height || element?.clientHeight || 640,
      width: rect?.width || element?.clientWidth || 960,
    });
  };
  emitRect();
  return observeElementRect(instance, emitRect);
};

const observeBlogElementOffset: VirtualizerOptions<
  HTMLElement,
  HTMLElement
>["observeElementOffset"] = (instance, callback) => {
  callback(instance.scrollElement?.scrollTop ?? 0, false);
  return observeElementOffset(instance, callback);
};
