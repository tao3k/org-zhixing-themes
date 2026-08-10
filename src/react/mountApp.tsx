import { RouterProvider } from "@tanstack/react-router";
import { createRoot } from "react-dom/client";
import { getReactQueryClient } from "./queryClient";
import { createOrgZhixingRouter } from "./router";
import { configureOrgPooFlowRunner } from "./orgPooFlowRendering";
import type { PooFlowRunner } from "./pooFlowModel";
import {
  isolatedSelectedThemeId,
  isolatedSelectedVariant,
  themeIsolationId,
} from "virtual:org-zhixing/theme-runtime";
import {
  loadIsolatedThemeRuntime,
  ThemeRuntimeProvider,
} from "../theme-system/react/ThemeRuntimeProvider";
import {
  claimThemeRuntimeBoundary,
  setThemeRuntimeBoundaryState,
} from "../theme-system/react/themeRuntimeBoundary";

export const mountApp = async (): Promise<void> => {
  const app = claimThemeRuntimeBoundary({
    isolationId: themeIsolationId,
    themeId: isolatedSelectedThemeId,
    variant: isolatedSelectedVariant,
  });

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
  setThemeRuntimeBoundaryState(app, "mounting");
  createRoot(app).render(
    <ThemeRuntimeProvider runtime={runtime}>
      <RouterProvider router={router} />
    </ThemeRuntimeProvider>,
  );
  setThemeRuntimeBoundaryState(app, "mounted");
};
