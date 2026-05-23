import { afterEach, describe, expect, it } from "vitest";
import type { AppDomNodes } from "../src/appDom";
import { bindBlogVirtualList } from "../src/blogVirtualList";

describe("Blog virtual list", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("enhances large Blog indexes with a TanStack Virtual scroll surface", async () => {
    const dom = mountVirtualBlogDom();
    const controller = new AbortController();
    bindBlogVirtualList(dom, controller.signal);
    await Promise.resolve();

    const list = dom.view.querySelector<HTMLElement>("[data-blog-virtual-list]");
    expect(list?.classList.contains("blog-index-list--virtual")).toBe(true);
    expect(list?.querySelector(".blog-virtual-spacer")).toBeTruthy();
    expect(list?.querySelectorAll(".blog-virtual-row").length).toBeGreaterThan(0);
    expect(list?.querySelector(".blog-index-article")?.textContent).toContain("Article");

    controller.abort();
  });

  it("cleans up the virtualizer on abort", async () => {
    const dom = mountVirtualBlogDom();
    const controller = new AbortController();
    bindBlogVirtualList(dom, controller.signal);
    await Promise.resolve();

    controller.abort();
    expect(controller.signal.aborted).toBe(true);
  });
});

const mountVirtualBlogDom = (count = 140): AppDomNodes => {
  document.body.innerHTML = `
    <div id="view">
      <div class="blog-index-list" data-blog-virtual-list>
        ${Array.from(
          { length: count },
          (_, index) => `
            <article role="listitem">
              <button type="button" class="blog-index-article" data-blog-article="${index + 1}">
                <span class="blog-index-meta"><span>2026-05-17</span><span>Blog</span></span>
                <strong>Article ${index + 1}</strong>
              </button>
            </article>
          `,
        ).join("")}
      </div>
    </div>
  `;
  return {
    view: document.querySelector<HTMLDivElement>("#view") as HTMLDivElement,
  };
};
