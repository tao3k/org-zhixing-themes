import type { TypstRenderRequest, TypstRenderResponse } from "./typstProtocol";

type TypstRenderer = (source: string) => Promise<string>;

type PendingRender = {
  reject: (error: Error) => void;
  resolve: (svg: string) => void;
};

type TypstPreviewRecord = {
  block: HTMLElement;
  preview: HTMLElement;
};

let worker: Worker | null = null;
let nextRequestId = 0;
const pendingRenders = new Map<number, PendingRender>();

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

const renderTypst: TypstRenderer = (source) =>
  new Promise((resolve, reject) => {
    const id = ++nextRequestId;
    pendingRenders.set(id, { reject, resolve });
    const request: TypstRenderRequest = { id, source };
    getWorker().postMessage(request);
  });

const typstLanguagePattern = /^(?:src-|language-)(?:typst|typ)$/i;

export const findOrgTypstBlocks = (root: ParentNode): HTMLElement[] =>
  [...root.querySelectorAll<HTMLElement>("pre")].filter((block) =>
    [...block.classList, ...(block.querySelector("code")?.classList ?? [])].some((className) =>
      typstLanguagePattern.test(className),
    ),
  );

const createTypstPreview = (block: HTMLElement): HTMLElement => {
  const preview = document.createElement("figure");
  preview.className = "org-typst-preview";
  preview.dataset.orgTypstState = "pending";
  preview.setAttribute("aria-busy", "true");
  const label = document.createElement("figcaption");
  label.textContent = "Typst preview";
  const output = document.createElement("div");
  output.className = "org-typst-preview-output";
  preview.append(label, output);
  block.before(preview);
  return preview;
};

const renderPreview = async (
  block: HTMLElement,
  preview: HTMLElement,
  render: TypstRenderer,
): Promise<() => void> => {
  preview.dataset.orgTypstState = "loading";
  const svg = await render(block.textContent ?? "");
  const output = preview.querySelector<HTMLElement>(".org-typst-preview-output");
  if (!output || !preview.isConnected) return () => undefined;
  const objectUrl = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
  const image = document.createElement("img");
  image.alt = "Rendered Typst document";
  image.decoding = "async";
  image.src = objectUrl;
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
  void renderPreview(record.block, record.preview, render)
    .then((release) => {
      if (isActive()) releaseUrls.push(release);
      else release();
    })
    .catch(() => {
      if (!isActive()) return;
      record.preview.dataset.orgTypstState = "fallback";
      record.preview.setAttribute("aria-busy", "false");
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
  const records = findOrgTypstBlocks(root).map((block) => ({
    block,
    preview: createTypstPreview(block),
  }));
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
  };
};
