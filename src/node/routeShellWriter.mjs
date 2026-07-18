import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parse } from "smol-toml";
import { renderAttachmentGallery } from "../attachmentGalleryRender.ts";
import { renderTravel } from "../travelRender.ts";

const thumbnailPathPattern = /^org-zhixing\.thumbnails\/[A-Za-z0-9._-]+\.webp$/;

export const writeRouteShells = async ({ distRoot, hydrate = false }) => {
  const indexPath = resolve(distRoot, "index.html");
  const indexHtml = await readFile(indexPath, "utf8");
  const baseHref = deploymentBaseHref(indexHtml);
  const staticData = await readJsonData(resolve(distRoot, "org-zhixing.static.json"));
  const siteConfig = await readTomlData(resolve(distRoot, "org-zhixing.toml"));
  const shellHtml = injectFetchPreloads(indexHtml, [
    `${baseHref}org-zhixing.static.json`,
    `${baseHref}org-zhixing.toml`,
  ]);
  const initialShellHtml = injectInitialAppShell(shellHtml);
  await writeFile(indexPath, initialShellHtml, "utf8");
  await writeFile(resolve(distRoot, "404.html"), initialShellHtml, "utf8");
  for (const route of ["blogs", "notes", "memory", "agenda", "capture", "diagnostics"]) {
    const routeRoot = resolve(distRoot, route);
    await mkdir(routeRoot, { recursive: true });
    await writeFile(resolve(routeRoot, "index.html"), initialShellHtml, "utf8");
  }

  const thumbnailPath = firstGalleryThumbnailPath(staticData);
  const galleryData = await readJsonData(resolve(distRoot, "org-zhixing.gallery.json"));
  const galleryDataHtml = galleryData
    ? initialShellHtml
    : injectFetchPreloads(initialShellHtml, [`${baseHref}org-zhixing.gallery.json`]);
  const galleryModuleHtml = galleryDataHtml;
  const galleryHtml = thumbnailPath
    ? injectImagePreload(galleryModuleHtml, `${baseHref}${thumbnailPath}`)
    : galleryModuleHtml;
  const prerenderedGalleryHtml = galleryData
    ? injectStaticRoutePage(
        galleryHtml,
        renderAttachmentGallery(galleryData, {
          publicAssetHref: (path) => `${baseHref}${String(path).replace(/^\/+/, "")}`,
        }),
        {
          activeView: "gallery",
          baseHref,
          preserveApplicationScripts: hydrate,
          siteConfig,
          staticData,
        },
      )
    : galleryHtml;
  const galleryRoot = resolve(distRoot, "gallery");
  await mkdir(galleryRoot, { recursive: true });
  await writeFile(resolve(galleryRoot, "index.html"), prerenderedGalleryHtml, "utf8");

  if (staticData?.travel) {
    const travelRoot = resolve(distRoot, "travel");
    await mkdir(travelRoot, { recursive: true });
    await writeFile(
      resolve(travelRoot, "index.html"),
      injectStaticRoutePage(initialShellHtml, renderTravel(null, undefined, staticData.travel), {
        activeView: "travel",
        baseHref,
        siteConfig,
        staticData,
      }),
      "utf8",
    );
  } else {
    const travelRoot = resolve(distRoot, "travel");
    await mkdir(travelRoot, { recursive: true });
    await writeFile(resolve(travelRoot, "index.html"), initialShellHtml, "utf8");
  }
};

export const injectInitialAppShell = (html) =>
  html.replace(
    /<div\s+id="app"\s*><\/div>/i,
    `<div id="app"><div data-initial-app-shell role="status" aria-live="polite" aria-label="Loading Zhixing" style="min-height:2.75rem;display:flex;align-items:baseline;gap:.625rem;padding:.75rem 1rem;font:500 1rem/1.25 system-ui,sans-serif;color:#252522;background:#faf9f6"><strong>知行合一</strong><small style="font-size:.75rem;color:#6f6d66">Loading…</small></div></div>`,
  );

export const injectStaticRoutePage = (
  html,
  routeHtml,
  {
    activeView,
    baseHref = "./",
    preserveApplicationScripts = false,
    siteConfig = null,
    staticData = null,
  } = {},
) => {
  const title = siteConfig?.site?.title ?? "Org Zhixing";
  const source = staticData?.sources?.[0];
  const navigation = staticNavigationItems(siteConfig, baseHref, activeView);
  const chrome = `<main class="shell" data-static-route="${escapeHtmlAttribute(activeView)}">
    <header class="site-header">
      <a class="site-brand" href="${escapeHtmlAttribute(`${baseHref}blogs`)}" aria-label="Zhixing home"><span>知行合一</span><small>Zhixing</small></a>
      <nav id="tabs" class="site-nav site-nav--desktop" aria-label="Life archive navigation">${navigation}</nav>
      <details class="static-mobile-navigation"><summary class="mobile-menu-trigger" aria-label="Open navigation"><span aria-hidden="true">☰</span><span>Menu</span></summary><nav aria-label="Mobile life archive navigation">${navigation}</nav></details>
      <output id="status" class="site-status">static site-wide</output>
    </header>
    <section class="site-hero"><div class="hero-copy"><p class="eyebrow">Personal digital garden</p><h1 id="site-title">${escapeHtmlAttribute(title)}</h1><p>把写作、札记、事件与行动议程放回同一个 Org 源头，让知识进入每天的实践。</p></div></section>
    <section class="viewer-pane"><div id="view">${routeHtml}</div></section>
    <div class="runtime-state" aria-hidden="true"><strong id="active-source-title">${escapeHtmlAttribute(source?.name ?? "Org source")}</strong><small id="active-source-path">${escapeHtmlAttribute(source?.file ?? "")}</small></div>
  </main>`;
  const rendered = html.replace(
    /<div\s+id="app"\s*>[\s\S]*?<\/div>(?=\s*<\/body>)/i,
    `<div id="app" data-static-route="${escapeHtmlAttribute(activeView)}">${chrome}</div>`,
  );
  return preserveApplicationScripts ? rendered : stripApplicationScripts(rendered);
};

export const injectFetchPreloads = (html, hrefs) =>
  hrefs.reduce(
    (output, href) =>
      injectHeadLink(
        output,
        `    <link rel="preload" as="fetch" href="${escapeHtmlAttribute(href)}" crossorigin />\n`,
      ),
    html,
  );

export const injectImagePreload = (html, href) => {
  const link = `    <link rel="preload" as="image" type="image/webp" href="${escapeHtmlAttribute(href)}" fetchpriority="high" />\n`;
  return injectHeadLink(html, link);
};

const injectHeadLink = (html, link) =>
  html.includes("</head>") ? html.replace("</head>", `${link}</head>`) : html;

const deploymentBaseHref = (html) => {
  const scriptSrc = html.match(/<script\b[^>]*\bsrc="([^"]+)"/i)?.[1];
  if (!scriptSrc) return "./";
  try {
    const pathname = new URL(scriptSrc, "https://org-zhixing.invalid/").pathname;
    const assetsIndex = pathname.lastIndexOf("/assets/");
    return assetsIndex === -1 ? "./" : `${pathname.slice(0, assetsIndex)}/`;
  } catch {
    return "./";
  }
};

const stripApplicationScripts = (html) =>
  html.replace(/\s*<script\b[^>]*\bsrc="[^"]+"[^>]*><\/script>/giu, "");

const staticNavigationItems = (config, baseHref, activeView) => {
  const configured = Array.isArray(config?.ui?.views) ? config.ui.views : [];
  const views = configured.length
    ? configured
    : [
        { id: "blog", label: "Blogs" },
        { id: "gallery", label: "Gallery" },
        { id: "records", label: "Notes" },
        { id: "travel", label: "Travel" },
        { id: "memory", label: "Memory" },
        { id: "agenda", label: "Agenda" },
      ];
  const routeFor = {
    blog: "blogs",
    gallery: "gallery/",
    records: "notes",
    travel: "travel",
    memory: "memory",
    agenda: "agenda",
  };
  return views
    .filter((item) => typeof routeFor[item?.id] === "string")
    .map(
      (item) =>
        `<a href="${escapeHtmlAttribute(`${baseHref}${routeFor[item.id]}`)}"${item.id === activeView ? ' aria-current="page"' : ""}>${escapeHtmlAttribute(item.label ?? item.id)}</a>`,
    )
    .join("");
};

export const escapeHtmlAttribute = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const firstGalleryThumbnailPath = (manifest) => {
  const thumbnailPath = manifest?.attachmentGallery?.firstThumbnailPath;
  return typeof thumbnailPath === "string" && thumbnailPathPattern.test(thumbnailPath)
    ? thumbnailPath
    : null;
};

const readJsonData = async (path) => {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return null;
  }
};

const readTomlData = async (path) => {
  try {
    return parse(await readFile(path, "utf8"));
  } catch {
    return null;
  }
};
