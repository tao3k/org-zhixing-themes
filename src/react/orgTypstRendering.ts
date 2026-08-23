import type { TypstRenderRequest, TypstRenderResponse } from "./typstProtocol";
import { BoundedLruCache } from "../core/boundedLruCache";
import { sanitizeTypstSvg } from "../core/typstSvg";

export type TypstRenderer = (source: string) => Promise<string>;

type PendingRender = {
  reject: (error: Error) => void;
  resolve: (svg: string) => void;
};

type TypstPreviewRecord = {
  block: HTMLElement;
  frame: HTMLElement;
  ownsFrame: boolean;
  preview: HTMLElement;
  staticPreview?: HTMLTemplateElement;
  toggle: HTMLButtonElement;
};

let worker: Worker | null = null;
let nextRequestId = 0;
const pendingRenders = new Map<number, PendingRender>();

export const createCachedTypstRenderer = (render: TypstRenderer, capacity = 64): TypstRenderer => {
  const cache = new BoundedLruCache<string, string>(capacity);
  const inFlight = new Map<string, Promise<string>>();
  return (source) => {
    const cached = cache.get(source);
    if (cached !== undefined) return Promise.resolve(cached);
    const pending = inFlight.get(source);
    if (pending) return pending;
    const request = render(source)
      .then((svg) => {
        cache.set(source, svg);
        return svg;
      })
      .finally(() => {
        if (inFlight.get(source) === request) inFlight.delete(source);
      });
    inFlight.set(source, request);
    return request;
  };
};

const getWorker = (): Worker => {
  if (worker) return worker;
  worker = new Worker(new URL("./typst.worker.ts", import.meta.url), {
    name: "org-zhixing-typst",
    type: "module",
  });
  worker.addEventListener("message", (event: MessageEvent<TypstRenderResponse>) => {
    const pending = pendingRenders.get(event.data.id);
    if (!pending) return;
    pendingRenders.delete(event.data.id);
    if (event.data.ok) pending.resolve(event.data.svg);
    else pending.reject(new Error(event.data.message));
  });
  worker.addEventListener("error", () => {
    for (const pending of pendingRenders.values()) {
      pending.reject(new Error("Typst worker failed"));
    }
    pendingRenders.clear();
    worker?.terminate();
    worker = null;
  });
  return worker;
};

const renderTypstUncached: TypstRenderer = (source) =>
  new Promise((resolve, reject) => {
    const id = ++nextRequestId;
    pendingRenders.set(id, { reject, resolve });
    const request: TypstRenderRequest = { id, source };
    getWorker().postMessage(request);
  });

const renderTypst = createCachedTypstRenderer(renderTypstUncached);

const typstLanguagePattern = /^(?:src-|language-)(?:typst|typ)$/i;

export { sanitizeTypstSvg } from "../core/typstSvg";

const isTypstBlock = (block: HTMLElement): boolean =>
  [...block.classList, ...(block.querySelector("code")?.classList ?? [])].some((className) =>
    typstLanguagePattern.test(className),
  ) ||
  block
    .closest("figure.org-code-highlight")
    ?.querySelector(":scope > figcaption")
    ?.textContent?.trim()
    .toLowerCase() === "typst";

export const findOrgTypstBlocks = (root: ParentNode): HTMLElement[] =>
  [...root.querySelectorAll<HTMLElement>("pre")].filter(isTypstBlock);

const createTypstPreview = (block: HTMLElement): TypstPreviewRecord => {
  const staticPreview =
    block.previousElementSibling instanceof HTMLTemplateElement &&
    block.previousElementSibling.dataset.orgTypstStaticPreview === "ready"
      ? block.previousElementSibling
      : undefined;
  const existingFrame = block.parentElement?.classList.contains("org-code-highlight")
    ? block.parentElement
    : null;
  const frame = existingFrame ?? document.createElement("figure");
  const ownsFrame = existingFrame === null;
  frame.classList.add("org-typst-block");
  frame.dataset.orgTypstView = "preview";
  if (ownsFrame) {
    block.before(frame);
    frame.append(block);
  }

  let label = frame.querySelector<HTMLElement>(":scope > figcaption");
  if (!label) {
    label = document.createElement("figcaption");
    label.textContent = "Typst";
    frame.prepend(label);
  }

  const toggle = document.createElement("button");
  toggle.className = "org-typst-view-toggle";
  toggle.type = "button";
  toggle.textContent = "Source code";
  toggle.setAttribute("aria-pressed", "false");
  label.append(toggle);

  const preview = document.createElement("div");
  preview.className = "org-typst-preview";
  preview.dataset.orgTypstState = "pending";
  preview.dataset.orgTypstView = "preview";
  preview.setAttribute("aria-busy", "true");
  const output = document.createElement("div");
  output.className = "org-typst-preview-output";
  preview.append(output);
  block.before(preview);
  block.hidden = true;

  toggle.addEventListener("click", () => {
    const showSource = frame.dataset.orgTypstView !== "source";
    frame.dataset.orgTypstView = showSource ? "source" : "preview";
    preview.dataset.orgTypstView = showSource ? "source" : "preview";
    preview.hidden = showSource;
    block.hidden = !showSource;
    toggle.textContent = showSource ? "Preview" : "Source code";
    toggle.setAttribute("aria-pressed", String(showSource));
  });

  return { block, frame, ownsFrame, preview, staticPreview, toggle };
};

const renderPreview = async (
  block: HTMLElement,
  preview: HTMLElement,
  render: TypstRenderer,
  staticPreview?: HTMLTemplateElement,
): Promise<() => void> => {
  preview.dataset.orgTypstState = "loading";
  const output = preview.querySelector<HTMLElement>(".org-typst-preview-output");
  if (staticPreview) {
    output?.replaceChildren(staticPreview.content.cloneNode(true));
    preview.dataset.orgTypstState = "ready";
    preview.setAttribute("aria-busy", "false");
    return () => undefined;
  }
  const svg = await render(block.textContent ?? "");
  if (!output || !preview.isConnected) return () => undefined;
  const objectUrl = URL.createObjectURL(
    new Blob([sanitizeTypstSvg(svg, getComputedStyle(preview).color)], {
      type: "image/svg+xml;charset=utf-8",
    }),
  );
  const image = document.createElement("img");
  image.alt = "Rendered Typst document";
  image.decoding = "async";
  image.loading = "eager";
  image.src = objectUrl;
  try {
    await image.decode?.().catch(() => {
      preview.dataset.orgTypstDecode = "failed";
    });
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw new Error("Rendered Typst SVG could not be decoded", {
      cause: error,
    });
  }
  if (!preview.isConnected) {
    URL.revokeObjectURL(objectUrl);
    return () => undefined;
  }
  image.style.width =
    image.naturalWidth > 0 ? `min(100%, ${Math.ceil(image.naturalWidth * 1.4)}px)` : "auto";
  image.style.maxWidth = "100%";
  image.style.height = "auto";
  output.replaceChildren(image);
  preview.dataset.orgTypstState = "ready";
  preview.setAttribute("aria-busy", "false");
  return () => URL.revokeObjectURL(objectUrl);
};

const beginTypstPreview = (
  record: TypstPreviewRecord,
  render: TypstRenderer,
  isActive: () => boolean,
  releaseUrls: Array<() => void>,
): void => {
  void renderPreview(record.block, record.preview, render, record.staticPreview)
    .then((release) => {
      if (isActive()) releaseUrls.push(release);
      else release();
    })
    .catch((error: unknown) => {
      if (!isActive()) return;
      const message = error instanceof Error ? error.message : String(error);
      const output = record.preview.querySelector<HTMLElement>(".org-typst-preview-output");
      const diagnostic = document.createElement("pre");
      diagnostic.className = "org-typst-preview-error";
      diagnostic.setAttribute("role", "alert");
      diagnostic.textContent = message;
      output?.replaceChildren(diagnostic);
      record.preview.dataset.orgTypstState = "error";
      record.preview.dataset.orgTypstError = message;
      record.preview.setAttribute("aria-busy", "false");
      console.error("Typst preview failed", error);
    });
};

const scheduleTypstPreviews = (
  records: TypstPreviewRecord[],
  start: (record: TypstPreviewRecord) => void,
): IntersectionObserver | null => {
  if (typeof IntersectionObserver !== "function") {
    for (const record of records) start(record);
    return null;
  }
  const recordByPreview = new Map(records.map((record) => [record.preview, record]));
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        const record = recordByPreview.get(entry.target as HTMLElement);
        if (record) start(record);
      }
    },
    { rootMargin: "320px 0px" },
  );
  for (const { preview } of records) observer.observe(preview);
  return observer;
};

export const installOrgTypstRendering = (
  root: ParentNode,
  render: TypstRenderer = renderTypst,
): (() => void) => {
  const records = findOrgTypstBlocks(root).map(createTypstPreview);
  if (records.length === 0) return () => undefined;
  let active = true;
  const releaseUrls: Array<() => void> = [];
  const observer = scheduleTypstPreviews(records, (record) =>
    beginTypstPreview(record, render, () => active, releaseUrls),
  );
  return () => {
    active = false;
    observer?.disconnect();
    for (const release of releaseUrls) release();
    for (const record of records) {
      record.block.hidden = false;
      record.toggle.remove();
      record.preview.remove();
      record.frame.classList.remove("org-typst-block");
      delete record.frame.dataset.orgTypstView;
      if (record.ownsFrame) record.frame.replaceWith(record.block);
    }
  };
};
