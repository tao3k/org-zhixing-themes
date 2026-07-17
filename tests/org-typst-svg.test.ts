import { describe, expect, it } from "vitest";

import { sanitizeTypstSvg } from "../src/react/orgTypstRendering";

describe("Typst SVG image compatibility", () => {
  it("escapes HTML-only entities and raw ampersands while preserving XML entities", () => {
    expect(
      sanitizeTypstSvg(
        "<svg><script>ready && value&nbsp;</script><text>&amp; &lt; &#160; &#xA0;</text></svg>",
      ),
    ).toBe(
      "<svg><script>ready &amp;&amp; value&amp;nbsp;</script><text>&amp; &lt; &#160; &#xA0;</text></svg>",
    );
  });

  it("maps Typst's default black ink to the active theme foreground", () => {
    expect(
      sanitizeTypstSvg('<svg><path fill="#000" stroke="#000" /></svg>', "rgb(205, 214, 244)"),
    ).toBe('<svg><path fill="rgb(205, 214, 244)" stroke="rgb(205, 214, 244)" /></svg>');
  });
});
