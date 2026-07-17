import { defineConfig, devices } from "@playwright/test";
import { scenarioSitePath } from "./playwright/sitePath";

delete process.env.FORCE_COLOR;
delete process.env.NO_COLOR;

const previewOrigin = "http://127.0.0.1:4173";

export default defineConfig({
  testDir: "./playwright",
  testIgnore: ["**/typst-rendering.spec.ts"],
  outputDir: "./reports/playwright",
  reporter: [["list"], ["html", { open: "never", outputFolder: "./reports/playwright-html" }]],
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: previewOrigin,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npx serve .cache/lighthouse --config ../../benchmarks/serve.json --listen 4173",
    cwd: process.cwd(),
    url: `${previewOrigin}${scenarioSitePath("/")}`,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
  projects: [
    {
      name: "compact-phone",
      use: { ...devices["Pixel 5"], viewport: { width: 360, height: 800 } },
    },
    {
      name: "modern-phone",
      use: {
        ...devices["iPhone 13"],
        browserName: "webkit",
        viewport: { width: 390, height: 844 },
      },
    },
    {
      name: "tablet",
      use: { ...devices["iPad (gen 7)"], viewport: { width: 768, height: 1024 } },
    },
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
  ],
});
