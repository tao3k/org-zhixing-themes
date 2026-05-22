import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("style module boundaries", () => {
  it("keeps the CSS entrypoint as an ordered module manifest", () => {
    const entry = readFileSync("src/styles.css", "utf8").trim().split("\n");

    expect(entry).toEqual([
      '@import "photoswipe/style.css";',
      '@import "./styles/foundation.css";',
      '@import "./styles/blog.css";',
      '@import "./styles/attachments.css";',
      '@import "./styles/travel.css";',
      '@import "./styles/records-memory.css";',
      '@import "./styles/agenda-list.css";',
      '@import "./styles/agenda-cockpit.css";',
      '@import "./styles/agenda-cockpit-responsive.css";',
      '@import "./styles/agenda-program.css";',
      '@import "./styles/agenda-program-responsive.css";',
      '@import "./styles/rendered-org.css";',
      '@import "./styles/blog-rendered.css";',
      '@import "./styles/responsive.css";',
    ]);
  });

  it("keeps product CSS modules below the monolith threshold", () => {
    const modules = readdirSync("src/styles").filter((name) => name.endsWith(".css"));
    const lineCounts = modules.map((name) => ({
      name,
      lines: readFileSync(join("src/styles", name), "utf8").split("\n").length - 1,
    }));

    expect(lineCounts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "travel.css" }),
        expect.objectContaining({ name: "agenda-program.css" }),
        expect.objectContaining({ name: "rendered-org.css" }),
      ]),
    );
    expect(Math.max(...lineCounts.map(({ lines }) => lines))).toBeLessThanOrEqual(1200);
  });
});
