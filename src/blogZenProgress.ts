import type { AppDomNodes } from "./appDom";

const progressSelector = "[data-blog-zen-progress]";
const progressVariable = "--blog-zen-progress";

export const bindBlogZenProgress = (dom: AppDomNodes, signal: AbortSignal): void => {
  let frame = 0;

  const update = (): void => {
    frame = 0;
    const progress = readingProgressPercent();
    for (const bar of dom.view.querySelectorAll<HTMLElement>(progressSelector)) {
      bar.style.setProperty(progressVariable, `${progress}%`);
    }
  };

  const schedule = (): void => {
    if (frame || signal.aborted) {
      return;
    }
    frame = window.requestAnimationFrame(update);
  };

  const observer = new MutationObserver(schedule);
  observer.observe(dom.view, { childList: true, subtree: true });
  window.addEventListener("scroll", schedule, { passive: true, signal });
  signal.addEventListener(
    "abort",
    () => {
      observer.disconnect();
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    },
    { once: true },
  );

  update();
};

const readingProgressPercent = (): number => {
  const root = document.documentElement;
  const scrollable = root.scrollHeight - root.clientHeight;
  if (scrollable <= 0) {
    return 0;
  }
  return Math.min(100, Math.max(0, (root.scrollTop / scrollable) * 100));
};
