import { $typst } from "@myriaddreamin/typst.ts";
import compilerWasmUrl from "@myriaddreamin/typst-ts-web-compiler/wasm?url";
import rendererWasmUrl from "@myriaddreamin/typst-ts-renderer/wasm?url";
import type { TypstRenderRequest, TypstRenderResponse } from "./typstProtocol";
import { prepareTypstPreviewSource } from "../core/typstSource";
import { BoundedLruCache } from "../core/boundedLruCache";

type WorkerScope = {
  addEventListener: (
    type: "message",
    listener: (event: MessageEvent<TypstRenderRequest>) => void,
  ) => void;
  postMessage: (message: TypstRenderResponse) => void;
};

const workerScope = globalThis as unknown as WorkerScope;

$typst.setCompilerInitOptions({
  getModule: () => compilerWasmUrl,
});
$typst.setRendererInitOptions({
  getModule: () => rendererWasmUrl,
});

let renderQueue = Promise.resolve();
const renderedSvgCache = new BoundedLruCache<string, string>(64);
const persistentCacheName = "org-zhixing-typst-svg-v1";
const persistentCacheLimit = 64;

const persistentCacheKey = async (source: string): Promise<Request> => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(source));
  const hex = [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return new Request(new URL(`__org-zhixing-typst-cache__/${hex}`, location.origin));
};

const readPersistentSvg = async (source: string): Promise<string | undefined> => {
  if (typeof caches === "undefined" || !crypto.subtle) return undefined;
  try {
    const cache = await caches.open(persistentCacheName);
    const response = await cache.match(await persistentCacheKey(source));
    return response?.text();
  } catch {
    return undefined;
  }
};

const writePersistentSvg = async (source: string, svg: string): Promise<void> => {
  if (typeof caches === "undefined" || !crypto.subtle) return;
  try {
    const cache = await caches.open(persistentCacheName);
    await cache.put(
      await persistentCacheKey(source),
      new Response(svg, { headers: { "content-type": "image/svg+xml;charset=utf-8" } }),
    );
    const keys = await cache.keys();
    await Promise.all(
      keys
        .slice(0, Math.max(0, keys.length - persistentCacheLimit))
        .map((key) => cache.delete(key)),
    );
  } catch {
    // Cache Storage can be disabled or quota-limited; the in-memory LRU remains authoritative.
  }
};

const formatTypstError = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;

  try {
    const serialized = JSON.stringify(error, null, 2);
    if (serialized && serialized !== "{}") return serialized;
  } catch {
    // Fall through to String so unusual compiler diagnostics still surface.
  }

  const message = String(error);
  return message && message !== "[object Object]" ? message : "Typst render failed";
};

workerScope.addEventListener("message", (event) => {
  const { id, source } = event.data;
  renderQueue = renderQueue
    .then(async () => {
      let svg = renderedSvgCache.get(source);
      if (svg === undefined) svg = await readPersistentSvg(source);
      if (svg === undefined) {
        svg = await $typst.svg({
          mainContent: prepareTypstPreviewSource(source),
        });
        await writePersistentSvg(source, svg);
      }
      renderedSvgCache.set(source, svg);
      workerScope.postMessage({ id, ok: true, svg });
    })
    .catch((error: unknown) => {
      workerScope.postMessage({
        id,
        message: formatTypstError(error),
        ok: false,
      });
    });
});
