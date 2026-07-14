import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { HtmlSurface } from "../src/react/HtmlSurface";

afterEach(() => {
  document.body.replaceChildren();
});

describe("HtmlSurface content stability", () => {
  it("preserves enhanced DOM when its HTML input has not changed", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const html = '<pre><code class="language-typst">= Stable</code></pre>';

    await act(() => root.render(<HtmlSurface html={html} />));
    const code = host.querySelector("code");
    expect(code).not.toBeNull();
    code?.setAttribute("data-enhanced", "ready");

    await act(() => root.render(<HtmlSurface html={html} />));
    expect(host.querySelector("code")?.dataset.enhanced).toBe("ready");

    await act(() => root.unmount());
  });
});
