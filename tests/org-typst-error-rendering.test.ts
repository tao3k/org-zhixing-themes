import { afterEach, describe, expect, it, vi } from "vitest";

import { installOrgTypstRendering } from "../src/react/orgTypstRendering";

describe("Org Typst rendering diagnostics", () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("surfaces compiler diagnostics as a machine-detectable error state", async () => {
    document.body.innerHTML = '<pre class="src-typst"><code>$ bad $</code></pre>';
    vi.stubGlobal("IntersectionObserver", undefined);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    installOrgTypstRendering(document, async () => {
      throw new Error("unknown variable: bad");
    });

    await vi.waitFor(() => {
      expect(
        document.querySelector(".org-typst-preview")?.getAttribute("data-org-typst-state"),
      ).toBe("error");
    });

    const preview = document.querySelector<HTMLElement>(".org-typst-preview");
    expect(preview?.dataset.orgTypstError).toBe("unknown variable: bad");
    expect(preview?.querySelector('[role="alert"]')?.textContent).toBe("unknown variable: bad");
    expect(consoleError).toHaveBeenCalledOnce();
  });
});
