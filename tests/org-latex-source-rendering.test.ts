import { afterEach, describe, expect, it, vi } from "vitest";
import { installOrgMathRendering } from "../src/react/orgMathRendering";

describe("Org LaTeX source rendering", () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it("replaces a LaTeX source block with a KaTeX display preview", async () => {
    document.body.innerHTML = String.raw`
      <pre class="src src-latex">\operatorname{Contribution}(c) \Rightarrow \operatorname{Profile}(c)</pre>
    `;

    installOrgMathRendering(document.body, async () => (_element: HTMLElement) => undefined);

    await vi.waitFor(() => {
      expect(document.body.dataset.orgMathState).toBe("ready");
    });

    expect(document.body.querySelector("pre.src-latex")).toBeNull();
    expect(document.body.querySelector(".org-latex-preview .katex-display")).not.toBeNull();
    expect(document.body.textContent).toContain("Contribution");
  });
});
