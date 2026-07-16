import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { performance } from "node:perf_hooks";
import { chromium } from "playwright";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const port = 5210;
const url = `http://127.0.0.1:${port}/`;
const environment = {
  ...process.env,
  ORG_ZHIXING_CONFIG: "tests/fixtures/federated-theme-site.toml",
};

await run(npm, ["exec", "--", "rsbuild", "build"], environment);
const preview = spawn(npm, ["exec", "--", "rsbuild", "preview", "--port", String(port)], {
  cwd: root,
  env: environment,
  stdio: ["ignore", "pipe", "pipe"],
});
let previewOutput = "";
preview.stdout.on("data", (chunk) => (previewOutput += chunk));
preview.stderr.on("data", (chunk) => (previewOutput += chunk));

let browser;
try {
  await waitForServer(url, preview);
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const startedAt = performance.now();
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Theme unavailable" }).waitFor({ timeout: 10_000 });
  const recoveryMs = Math.round(performance.now() - startedAt);
  const surface = await page.locator("#app").innerText();
  if (!surface.includes("THEME-E034")) {
    throw new Error("SCENARIO-E003 federated failure did not expose THEME-E034");
  }
  if (!(await page.getByRole("button", { name: "Retry theme" }).isVisible())) {
    throw new Error("SCENARIO-E003 federated failure did not expose a retry action");
  }
  if (recoveryMs > 10_000) {
    throw new Error(`SCENARIO-E002 federated recovery current=${recoveryMs}ms limit=10000ms`);
  }
  console.log(`scenario-theme-federation status=ok recoveryMs=${recoveryMs} retry=visible`);
} finally {
  await browser?.close();
  preview.kill("SIGTERM");
  await Promise.race([
    new Promise((resolveExit) => preview.once("exit", resolveExit)),
    new Promise((resolveTimeout) => setTimeout(resolveTimeout, 2_000)),
  ]);
  if (preview.exitCode === null) preview.kill("SIGKILL");
}

async function run(command, args, env) {
  await new Promise((resolveRun, rejectRun) => {
    const child = spawn(command, args, { cwd: root, env, stdio: "ignore" });
    child.once("error", rejectRun);
    child.once("exit", (code) =>
      code === 0
        ? resolveRun()
        : rejectRun(new Error(`SCENARIO-E003 command failed: ${command} ${args.join(" ")}`)),
    );
  });
}

async function waitForServer(target, child) {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`SCENARIO-E003 preview exited early:\n${previewOutput}`);
    }
    try {
      const response = await fetch(target);
      if (response.ok) return;
    } catch {
      // The preview server has not bound its port yet.
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 100));
  }
  throw new Error(`SCENARIO-E003 preview did not start:\n${previewOutput}`);
}
