import { afterEach, describe, expect, it, vi } from "vitest";
import { containsOrgMath, installOrgMathRendering } from "../src/react/orgMathRendering";

afterEach(() => {
  document.body.replaceChildren();
});

describe("Org LaTeX math rendering", () => {
  it("detects Org math delimiters and LaTeX source blocks", () => {
    document.body.innerHTML = `
      <p>Euler: \\(e^{i\\pi} + 1 = 0\\)</p>
      <pre><code>const sample = "$not_math$";</code></pre>
    `;
    expect(containsOrgMath(document.body)).toBe(true);

    document.body.innerHTML = `<pre class="src src-latex">\\[x^2\\]</pre>`;
    expect(containsOrgMath(document.body)).toBe(true);
  });

  it("loads KaTeX on demand with safe Org delimiter options", async () => {
    document.body.innerHTML = `<p>Area: $A = \\pi r^2$</p>`;
    const renderMath = vi.fn();

    installOrgMathRendering(document.body, async () => renderMath);
    await vi.waitFor(() => expect(document.body.dataset.orgMathState).toBe("ready"));

    expect(renderMath).toHaveBeenCalledWith(
      document.body,
      expect.objectContaining({
        throwOnError: false,
        trust: false,
        delimiters: expect.arrayContaining([
          { display: true, left: "\\[", right: "\\]" },
          { display: false, left: "\\(", right: "\\)" },
        ]),
      }),
    );
  });

  it("keeps readable source when the renderer cannot load", async () => {
    document.body.innerHTML = `<p>Fallback: \\(x + y\\)</p>`;
    installOrgMathRendering(document.body, async () => {
      throw new Error("offline");
    });

    await vi.waitFor(() => expect(document.body.dataset.orgMathState).toBe("fallback"));
    expect(document.body.textContent).toContain("\\(x + y\\)");
  });
});
