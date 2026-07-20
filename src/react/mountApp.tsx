import { RouterProvider } from "@tanstack/react-router";
import { createRoot } from "react-dom/client";
import { getReactQueryClient } from "./queryClient";
import { createOrgZhixingRouter } from "./router";
import { configureOrgPooFlowRunner } from "./orgPooFlowRendering";
import type { PooFlowRunner } from "./pooFlowModel";
import {
  loadIsolatedThemeRuntime,
  ThemeRuntimeProvider,
} from "../theme-system/react/ThemeRuntimeProvider";

export const mountApp = async (): Promise<void> => {
  const app = document.querySelector<HTMLDivElement>("#app");
  if (!app) throw new Error("missing #app root");

  const runtime = await loadIsolatedThemeRuntime();
  let pooFlowRunnerPromise: Promise<PooFlowRunner> | undefined;
  const pooFlowRunner: PooFlowRunner = {
    run: async (block, options) => {
      pooFlowRunnerPromise ??= import("./pooFlowWasmRunner").then(({ createPooFlowWasmRunner }) =>
        createPooFlowWasmRunner(),
      );
      return (await pooFlowRunnerPromise).run(block, options);
    },
  };
  const stopPooFlow = configureOrgPooFlowRunner(pooFlowRunner);
  window.addEventListener("pagehide", stopPooFlow, { once: true });
  const router = createOrgZhixingRouter({
    getQueryClient: getReactQueryClient,
    selectedTheme: runtime.selectedTheme,
  });
  createRoot(app).render(
    <ThemeRuntimeProvider runtime={runtime}>
      <RouterProvider router={router} />
    </ThemeRuntimeProvider>,
  );
};
