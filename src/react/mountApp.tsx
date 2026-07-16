import { RouterProvider } from "@tanstack/react-router";
import { createRoot } from "react-dom/client";
import { router } from "./router";
import { ThemeRuntimeProvider } from "../theme-system/react/ThemeRuntimeProvider";

export const mountApp = (): void => {
  const app = document.querySelector<HTMLDivElement>("#app");
  if (!app) throw new Error("missing #app root");

  createRoot(app).render(
    <ThemeRuntimeProvider>
      <RouterProvider router={router} />
    </ThemeRuntimeProvider>,
  );
};
