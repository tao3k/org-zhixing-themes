import { defineConfig, devices } from "@playwright/test";

delete process.env.FORCE_COLOR;
delete process.env.NO_COLOR;

const baseURL = "http://127.0.0.1:4183";

export default defineConfig({
  testDir: "./playwright-documents",
  outputDir: "./reports/playwright-documents",
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "./reports/playwright-documents-html" }],
  ],
  retries: process.env.CI ? 1 : 0,
  timeout: 120_000,
  workers: 1,
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command:
      "node packages/theme-tooling/src/theme-preview.mjs --theme documents --content-dir docs --port 4183",
    cwd: process.cwd(),
    url: `${baseURL}/`,
    reuseExistingServer: false,
    timeout: 60_000,
    gracefulShutdown: {
      signal: "SIGTERM",
      timeout: 5_000,
    },
  },
  projects: [
    {
      name: "documents-mobile",
      use: {
        ...devices["Pixel 5"],
        viewport: { width: 390, height: 844 },
      },
    },
    {
      name: "documents-desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
  ],
});
