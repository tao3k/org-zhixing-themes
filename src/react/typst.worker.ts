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
      if (svg === undefined) {
        svg = await $typst.svg({
          mainContent: prepareTypstPreviewSource(source),
        });
        renderedSvgCache.set(source, svg);
      }
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
