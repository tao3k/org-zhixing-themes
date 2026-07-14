import { $typst } from "@myriaddreamin/typst.ts";
import compilerWasmUrl from "@myriaddreamin/typst-ts-web-compiler/wasm?url";
import rendererWasmUrl from "@myriaddreamin/typst-ts-renderer/wasm?url";
import type { TypstRenderRequest, TypstRenderResponse } from "./typstProtocol";

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

workerScope.addEventListener("message", (event) => {
  const { id, source } = event.data;
  renderQueue = renderQueue
    .then(async () => {
      const svg = await $typst.svg({ mainContent: source });
      workerScope.postMessage({ id, ok: true, svg });
    })
    .catch((error: unknown) => {
      workerScope.postMessage({
        id,
        message: error instanceof Error ? error.message : "Typst render failed",
        ok: false,
      });
    });
});
