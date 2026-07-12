import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  escapeHtmlAttribute,
  injectImagePreload,
  writeRouteShells,
} from "../src/node/routeShellWriter.mjs";

const shell =
  '<!doctype html><html><head><title>Zhixing</title><script type="module" src="/org-zhixing-themes/assets/app.js"></script></head><body><div id="app"></div></body></html>';

describe("route shell writer", () => {
  it("preloads only the first projected Gallery WebP in the Gallery shell", async () => {
    const distRoot = await mkdtemp(resolve(tmpdir(), "org-zhixing-route-shell-"));
    await writeFile(resolve(distRoot, "index.html"), shell, "utf8");
    await writeFile(
      resolve(distRoot, "org-zhixing.static.json"),
      JSON.stringify({
        attachmentGallery: {
          firstThumbnailPath: "org-zhixing.thumbnails/first.webp",
        },
      }),
      "utf8",
    );
    await writeFile(resolve(distRoot, "org-zhixing.toml"), '[site]\ntitle = "Zhixing"\n', "utf8");
    await writeFile(
      resolve(distRoot, "org-zhixing.gallery.json"),
      JSON.stringify({ schemaVersion: 1, records: [], entryCount: 0, sourceCount: 0 }),
      "utf8",
    );

    await writeRouteShells({ distRoot });

    const rootHtml = await readFile(resolve(distRoot, "index.html"), "utf8");
    const fallbackHtml = await readFile(resolve(distRoot, "404.html"), "utf8");
    const galleryHtml = await readFile(resolve(distRoot, "gallery/index.html"), "utf8");
    for (const route of ["blogs", "notes", "memory", "agenda", "capture", "diagnostics"]) {
      const routeHtml = await readFile(resolve(distRoot, route, "index.html"), "utf8");
      expect(routeHtml).toContain("data-initial-app-shell");
      expect(routeHtml).toContain("/org-zhixing-themes/assets/app.js");
    }
    for (const html of [rootHtml, fallbackHtml]) {
      expect(html).toContain("data-initial-app-shell");
      expect(html).toContain('role="status"');
      expect(html).toContain('aria-live="polite"');
      expect(html).toContain("org-zhixing.static.json");
      expect(html).toContain("org-zhixing.toml");
      expect(html).toContain('as="fetch"');
    }
    expect(galleryHtml).toContain('data-static-route="gallery"');
    expect(galleryHtml).toContain('aria-label="Attachment gallery"');
    expect(galleryHtml).not.toContain("data-initial-app-shell");
    expect(galleryHtml).not.toContain('<script type="module"');
    expect(rootHtml).not.toContain("org-zhixing.gallery.json");
    expect(fallbackHtml).not.toContain("org-zhixing.gallery.json");
    expect(galleryHtml).not.toContain("org-zhixing.gallery.json");
    expect(galleryHtml).not.toContain('rel="modulepreload"');
    expect(galleryHtml).toContain('rel="preload" as="image" type="image/webp"');
    expect(galleryHtml).toContain('href="/org-zhixing-themes/org-zhixing.thumbnails/first.webp"');
    const href = galleryHtml.match(/<link[^>]+as="image"[^>]+href="([^"]+)"/)?.[1];
    expect(new URL(href!, "https://tao3k.github.io/org-zhixing-themes/gallery/").pathname).toBe(
      "/org-zhixing-themes/org-zhixing.thumbnails/first.webp",
    );
  });

  it("writes a plain Gallery shell when thumbnail data is absent or unsupported", async () => {
    const distRoot = await mkdtemp(resolve(tmpdir(), "org-zhixing-route-shell-"));
    await writeFile(resolve(distRoot, "index.html"), shell, "utf8");
    await writeFile(
      resolve(distRoot, "org-zhixing.static.json"),
      JSON.stringify({
        attachmentGallery: {
          firstThumbnailPath: "../unsafe/image.png",
        },
      }),
      "utf8",
    );

    await writeRouteShells({ distRoot });

    const galleryHtml = await readFile(resolve(distRoot, "gallery/index.html"), "utf8");
    expect(galleryHtml).toContain("data-initial-app-shell");
    expect(galleryHtml).not.toContain('as="image"');
    expect(galleryHtml).toContain("/org-zhixing-themes/org-zhixing.gallery.json");
  });

  it("escapes injected attribute values", () => {
    expect(escapeHtmlAttribute("a&b\"<c>'")).toBe("a&amp;b&quot;&lt;c&gt;&#039;");
    expect(injectImagePreload(shell, 'image" onload="bad.webp')).toContain(
      'href="image&quot; onload=&quot;bad.webp"',
    );
  });
});
