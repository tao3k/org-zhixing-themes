import { defineConfig, devices } from "@playwright/test";

delete process.env.FORCE_COLOR;

const baseURL = "http://127.0.0.1:4173/org-zhixing-themes";

export default defineConfig({
  testDir: "./playwright",
  outputDir: "./reports/playwright",
  reporter: [["list"], ["html", { open: "never", outputFolder: "./reports/playwright-html" }]],
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npx rsbuild preview --host 127.0.0.1 --port 4173",
    cwd: process.cwd(),
    url: `${baseURL}/`,
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
